
(function () {
	const PASSWORD = '123456';
	const DEFAULT_AK = '568360ea4b91487bbe19abab119af9ab';

	// Runtime refs（延后到 DOM Ready 再赋值）
	let gateEl, appEl, pwdInput, pwdSubmit, pwdError;
	let akInput, shareText, parseBtn, statusEl;
	let toastEl;
	let resultSection, titleEl, videoUrlEl, coverUrlEl, coverImgEl, downloadVideoBtn, downloadCoverBtn, openVideoBtn, copyVideoBtn, openCoverBtn, copyCoverBtn;

	function bindRefs() {
		gateEl = document.getElementById('password-gate');
		appEl = document.getElementById('app');
		pwdInput = document.getElementById('password-input');
		pwdSubmit = document.getElementById('password-submit');
		pwdError = document.getElementById('password-error');
		akInput = document.getElementById('api-ak');
		shareText = document.getElementById('share-text');
		parseBtn = document.getElementById('parse-btn');
		statusEl = document.getElementById('status');
		toastEl = document.getElementById('toast');
		resultSection = document.getElementById('result');
		titleEl = document.getElementById('title');
		videoUrlEl = document.getElementById('video-url');
		coverUrlEl = document.getElementById('cover-url');
		coverImgEl = document.getElementById('cover-img');
		downloadVideoBtn = document.getElementById('download-video');
		downloadCoverBtn = document.getElementById('download-cover');
		openVideoBtn = document.getElementById('open-video');
		copyVideoBtn = document.getElementById('copy-video');
		openCoverBtn = document.getElementById('open-cover');
		copyCoverBtn = document.getElementById('copy-cover');
	}

	function handleEnter() {
		if (!pwdInput || !gateEl || !appEl) {
			console.warn('元素未就绪，延迟重试');
			bindRefs();
		}
		const value = (pwdInput && pwdInput.value ? pwdInput.value : '').trim();
		console.log('尝试进入，输入长度：', value.length);
		if (value === PASSWORD) {
			if (gateEl) { gateEl.classList.add('hidden'); gateEl.style.display = 'none'; }
			if (appEl) { appEl.classList.remove('hidden'); appEl.style.display = 'block'; }
			if (pwdError) pwdError.textContent = '';
			if (akInput && !akInput.value) akInput.value = DEFAULT_AK;
			shareText && shareText.focus();
		} else {
			if (pwdError) pwdError.textContent = '密码错误，请重试';
		}
	}

	function mountGateHandlers() {
		if (!pwdSubmit || !pwdInput) return;
		pwdSubmit.addEventListener('click', handleEnter);
		pwdInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') { handleEnter(); }
		});
		// 兜底：在 Gate 可见时，全局回车也触发
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' && gateEl && !gateEl.classList.contains('hidden')) {
				handleEnter();
			}
		});
		// 暴露全局
		window.__enter = handleEnter;
	}

	// Utils
	function extractFirstHttpUrl(text) {
		if (!text) return '';
		const regex = /(https?:\/\/[\w\-._~:/?#\[\]@!$&'()*+,;=%]+)\b/i;
		const match = text.match(regex);
		return match ? match[1] : '';
	}

	function setStatus(text, type) {
		statusEl.textContent = text || '';
		statusEl.style.color = type === 'error' ? '#d14343' : '#555';
	}

	function showToast(message, level) {
		if (!toastEl) return;
		const node = document.createElement('div');
		node.className = 'toast ' + (level || '');
		node.textContent = message;
		toastEl.appendChild(node);
		setTimeout(() => { node.remove(); }, 2400);
	}

	async function fetchDetail(apiAk, linkUrl) {
		const endpoint = `https://api.guijianpan.com/waterRemoveDetail/xxmQsyByAk?ak=${encodeURIComponent(apiAk)}&link=${encodeURIComponent(linkUrl)}`;
		const res = await fetch(endpoint, { method: 'GET' });
		if (!res.ok) throw new Error('网络请求失败');
		const data = await res.json();
		if (!data || data.code !== '10000' || !data.content || !data.content.success) {
			throw new Error(data && data.msg ? data.msg : '接口返回异常');
		}
		return data.content;
	}

	function renderResult(content) {
		const { title, url, cover } = content;
		titleEl.textContent = title || '';
		videoUrlEl.textContent = url || '';
		videoUrlEl.href = url || '#';
		coverUrlEl.textContent = cover || '';
		coverUrlEl.href = cover || '#';
		if (cover) {
			coverImgEl.src = cover;
			coverImgEl.alt = title || '封面';
		}
		resultSection.classList.remove('hidden');
	}

	function withProxy(rawUrl) {
		return `/proxy?target=${encodeURIComponent(rawUrl)}`;
	}

	async function downloadByUrl(url, filename) {
		// 优先尝试 a[download]
		try {
			const anchor = document.createElement('a');
			anchor.href = withProxy(url);
			anchor.download = filename || '';
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			return;
		} catch (_) { /* 忽略并降级 */ }

		// 降级：fetch+blob 以应对某些跨域头允许的情况
		try {
			const response = await fetch(withProxy(url), { mode: 'cors' });
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename || 'download';
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(blobUrl);
		} catch (err) {
			alert('下载被服务器拒绝或跨域限制。已提供“在新窗口打开/复制地址”。');
		}
	}

	function openInNewTabNoReferrer(url) {
		// 通过本地代理打开
		window.open(withProxy(url), '_blank');
	}

	async function copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
			setStatus('已复制到剪贴板');
		} catch (_) {
			// 兜底选中复制
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
			setStatus('已复制到剪贴板');
		}
	}

	document.addEventListener('DOMContentLoaded', function () {
		bindRefs();
		mountGateHandlers();
		console.log('DOM 已就绪，事件已挂载');
		if (parseBtn) {
			parseBtn.addEventListener('click', async function () {
				let ak = (akInput.value || '').trim();
				const raw = (shareText.value || '').trim();
				// 如果未填写，则使用默认 AK
				if (!ak) { ak = DEFAULT_AK; if (akInput) akInput.value = DEFAULT_AK; }
				if (!raw) { setStatus('请粘贴包含链接的分享文本', 'error'); return; }
				const link = extractFirstHttpUrl(raw);
				if (!link) { setStatus('未识别到 http/https 链接，请检查内容', 'error'); return; }

				setStatus('解析中...');
				parseBtn.classList.add('loading');
				parseBtn.disabled = true;
				try {
					const content = await fetchDetail(ak, link);
					renderResult(content);
					setStatus('解析成功');
					showToast('解析成功', 'success');
					// 绑定下载/打开/复制事件
					const filenameSafeTitle = (content.title || 'video').replace(/[\\/:*?"<>|\n\r]+/g, '_').slice(0, 60);
					downloadVideoBtn.onclick = function () { if (content.url) downloadByUrl(content.url, filenameSafeTitle + '.mp4'); };
					downloadCoverBtn.onclick = function () { if (content.cover) downloadByUrl(content.cover, filenameSafeTitle + '.jpg'); };
					openVideoBtn.onclick = function () { if (content.url) openInNewTabNoReferrer(content.url); };
					openCoverBtn.onclick = function () { if (content.cover) openInNewTabNoReferrer(content.cover); };
					copyVideoBtn.onclick = function () { if (content.url) copyToClipboard(content.url); };
					copyCoverBtn.onclick = function () { if (content.cover) copyToClipboard(content.cover); };
				} catch (err) {
					console.error(err);
					setStatus(err && err.message ? err.message : '解析失败', 'error');
					showToast('解析失败：' + (err && err.message ? err.message : ''), 'error');
				} finally {
					parseBtn.disabled = false;
					parseBtn.classList.remove('loading');
				}
			});
		}
	});
})();


