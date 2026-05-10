// --- 各種初始化邏輯 ---
window.addEventListener('DOMContentLoaded', function() {
    // 1. 初始化 DOM 元素引用
    const imageInput = document.getElementById("imageInput")
    const cameraInput = document.getElementById("cameraInput")
    const uploadButton = document.getElementById("uploadButton")
    const cameraButton = document.getElementById("cameraButton")
    const cameraModal = document.getElementById("cameraModal")
    const cameraCloseButton = document.getElementById("cameraCloseButton")
    const capturePhotoButton = document.getElementById("capturePhotoButton")
    const fallbackUploadButton = document.getElementById("fallbackUploadButton")
    const providerSelect = document.getElementById("providerSelect")
    const generateButton = document.getElementById("generateButton")
    const presetButtons = document.querySelectorAll(".preset-button")
    const downloadButton = document.getElementById("downloadButton")

    // 2. 燈箱大圖功能
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const previewImage = document.getElementById('previewImage');
    const resultImage = document.getElementById('resultImage');
    const stylePreviewImg = document.getElementById('stylePreviewImg');

    if (lightbox && lightboxImg) {
        [previewImage, resultImage, stylePreviewImg].forEach(img => {
            if (!img) return;
            img.addEventListener('click', function() {
                if (this.src && this.style.display !== 'none' && this.src !== window.location.href) {
                    lightboxImg.src = this.src;
                    lightbox.classList.add('open');
                }
            });
        });
        lightbox.addEventListener('click', function() {
            lightbox.classList.remove('open');
        });
    }

    // 3. API Key 眼睛功能
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleApiKey = document.getElementById('toggleApiKey');
    const eyeIcon = document.getElementById('eyeIcon');
    if (apiKeyInput && toggleApiKey && eyeIcon) {
        let apiKeyVisible = false;
        toggleApiKey.addEventListener('click', function() {
            apiKeyVisible = !apiKeyVisible;
            apiKeyInput.type = apiKeyVisible ? 'text' : 'password';
            if (apiKeyVisible) {
                eyeIcon.innerHTML = '<ellipse cx="12" cy="12" rx="8" ry="5"/><circle cx="12" cy="12" r="2.5"/><line x1="4" y1="20" x2="20" y2="4" stroke="#d88fa4" stroke-width="2"/>';
            } else {
                eyeIcon.innerHTML = '<ellipse cx="12" cy="12" rx="8" ry="5"/><circle cx="12" cy="12" r="2.5"/>';
            }
        });
    }

    // 4. 綁定風格按鈕事件
    presetButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setActivePreset(button.dataset.preset);
        });
    });

    // 5. 綁定其他 UI 事件 (上傳、拍照等)
    if (imageInput) imageInput.addEventListener("change", handleFileSelection);
    if (cameraInput) cameraInput.addEventListener("change", handleFileSelection);
    if (uploadButton && imageInput) uploadButton.addEventListener("click", () => imageInput.click());
    if (cameraButton) cameraButton.addEventListener("click", openCameraModal);
    if (cameraCloseButton) cameraCloseButton.addEventListener("click", closeCameraModal);
    if (capturePhotoButton) capturePhotoButton.addEventListener("click", capturePhotoFromCamera);
    if (fallbackUploadButton && cameraInput) {
        fallbackUploadButton.addEventListener("click", () => {
            closeCameraModal();
            cameraInput.click();
        });
    }
    if (cameraModal) {
        cameraModal.addEventListener("click", (event) => {
            if (event.target === cameraModal) closeCameraModal();
        });
    }
    if (providerSelect) providerSelect.addEventListener("change", updateProviderFields);
    if (generateButton) generateButton.addEventListener("click", generateImage);
    if (downloadButton) {
        downloadButton.addEventListener("click", () => {
            if (resultImage && resultImage.src) {
                const a = document.createElement("a");
                a.href = resultImage.src;
                // Azure DALL-E 回傳的是 base64，可以直接下載
                a.download = `room-style-${selectedPreset}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    // 6. 初始狀態設定
    if (previewImage) previewImage.style.display = "none";
    if (resultImage) resultImage.style.display = "none";
    updateProviderFields();
    setActivePreset(selectedPreset);

    // 7. 載入預設圖片
    fetch('images/範例原圖.png')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], '範例原圖.png', { type: 'image/png' });
            updatePreview(file);
        })
        .catch(err => console.error("預設圖片載入失敗", err));
});

// 全域常數與變數
const FIXED_AZURE_OPENAI_URL = "https://wchsi-mg24ws7f-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-image-2/images/edits?api-version=2025-04-01-preview"

const presetPrompts = {
    "modern-luxe": "modern luxury interior, warm layered lighting, marble and wood finishes, elegant custom furniture, refined hotel residence mood",
    "minimal-japandi": "Japandi interior, natural wood texture, soft beige palette, minimalist styling, calm atmosphere, organic materials",
    "scandinavian-bright": "Scandinavian interior design, bright natural daylight, white walls, light oak furniture, airy and functional composition",
    "industrial-loft": "industrial loft interior, concrete texture, matte black metal, moody lighting, urban furniture styling, sophisticated raw materials",
    "coastal-relax": "coastal resort interior, breezy natural light, off-white and sand palette, woven textures, relaxed elegant styling",
    "future-smart": "futuristic smart home interior, integrated ambient LED lighting, sleek surfaces, premium tech furniture, cinematic modern atmosphere",
    "vintage-retro": "vintage retro interior, mid-century modern furniture, warm nostalgic tones, classic patterns, cozy ambiance",
    "bohemian-chic": "bohemian chic interior, eclectic decor, vibrant colors, macrame, abundant indoor plants, relaxed cozy vibe",
    "cyberpunk-neon": "cyberpunk neon interior, dark moody aesthetics, glowing neon accents, high-tech elements, futuristic metallic surfaces",
    "zen-meditation": "zen meditation space, completely uncluttered, tatami mats, bamboo sliding doors, soft diffused sunlight, ultimate peacefulness",
    "french-chic": "french chic interior, elegant Parisian apartment, ornate wall moldings, vintage chandelier, velvet furniture, romantic and sophisticated",
    "wabi-sabi": "wabi-sabi interior, rustic beauty, imperfect organic textures, earthy tones, raw natural materials, calm and spiritual",
    "modern-farmhouse": "modern farmhouse interior, rustic charm meets contemporary design, shiplap walls, exposed wooden beams, cozy and welcoming",
    "pastel-dream": "pastel dream interior, soft candy colors, rounded fluffy furniture, playful and dreamy atmosphere, whimsical decor"
}

let selectedFile = null
let previewUrl = ""
let selectedPreset = "modern-luxe"
let cameraStream = null

function setStatus(message) {
    const statusText = document.getElementById("statusText")
    if (statusText) statusText.textContent = message
}

function updateProviderFields() {
    const providerSelect = document.getElementById("providerSelect")
    const azureEndpointField = document.getElementById("azureEndpointField")
    const azureDeploymentField = document.getElementById("azureDeploymentField")
    const azureApiVersionField = document.getElementById("azureApiVersionField")
    const apiKeyHint = document.getElementById("apiKeyHint")

    if (!providerSelect) return
    const isAzure = providerSelect.value === "azure"
    if (azureEndpointField) azureEndpointField.classList.toggle("hidden", !isAzure)
    if (azureDeploymentField) azureDeploymentField.classList.toggle("hidden", !isAzure)
    if (azureApiVersionField) azureApiVersionField.classList.toggle("hidden", !isAzure)
    if (apiKeyHint) apiKeyHint.textContent = isAzure ? "請輸入 Azure OpenAI Key" : "只會用在這次請求"
}

function updatePreview(file) {
    if (!file) return
    selectedFile = file
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)

    const previewImage = document.getElementById("previewImage")
    const previewPlaceholder = document.getElementById("previewPlaceholder")
    const resultImage = document.getElementById("resultImage")
    const resultPlaceholder = document.getElementById("resultPlaceholder")

    if (previewImage) {
        previewImage.src = previewUrl
        previewImage.style.display = "block"
    }
    if (previewPlaceholder) previewPlaceholder.style.display = "none"
    if (resultImage) {
        resultImage.removeAttribute("src")
        resultImage.style.display = "none"
    }
    const downloadButton = document.getElementById("downloadButton")
    if (downloadButton) {
        downloadButton.style.display = "none"
    }
    if (resultPlaceholder) resultPlaceholder.style.display = "grid"
    setStatus(`已選擇圖片：${file.name || "相機照片"}`)
}

function stopCameraStream() {
    if (!cameraStream) return
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
    const cameraPreview = document.getElementById("cameraPreview")
    if (cameraPreview) cameraPreview.srcObject = null
}

function closeCameraModal() {
    const cameraModal = document.getElementById("cameraModal")
    if (cameraModal) {
        cameraModal.classList.remove("open")
        cameraModal.setAttribute("aria-hidden", "true")
    }
    stopCameraStream()
}

async function openCameraModal() {
    const cameraInput = document.getElementById("cameraInput")
    const cameraPreview = document.getElementById("cameraPreview")
    const cameraModal = document.getElementById("cameraModal")

    if (!navigator.mediaDevices?.getUserMedia) {
        if (cameraInput) cameraInput.click()
        return
    }
    try {
        stopCameraStream()
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        })
        if (cameraPreview) cameraPreview.srcObject = cameraStream
        if (cameraModal) {
            cameraModal.classList.add("open")
            cameraModal.setAttribute("aria-hidden", "false")
        }
        setStatus("Webcam 已開啟，請按下拍照。")
    } catch (error) {
        console.error(error)
        setStatus("無法開啟 webcam，已改用裝置原生拍照 / 上傳。")
        if (cameraInput) cameraInput.click()
    }
}

async function capturePhotoFromCamera() {
    const cameraPreview = document.getElementById("cameraPreview")
    const cameraCanvas = document.getElementById("cameraCanvas")
    if (!cameraStream || !cameraPreview) return

    const videoWidth = cameraPreview.videoWidth
    const videoHeight = cameraPreview.videoHeight
    if (!videoWidth || !videoHeight) {
        setStatus("鏡頭尚未準備完成，請稍後再拍一次。")
        return
    }
    if (cameraCanvas) {
        cameraCanvas.width = videoWidth
        cameraCanvas.height = videoHeight
        const context = cameraCanvas.getContext("2d")
        context.drawImage(cameraPreview, 0, 0, videoWidth, videoHeight)
        const blob = await new Promise((resolve) => {
            cameraCanvas.toBlob(resolve, "image/jpeg", 0.92)
        })
        if (!blob) {
            setStatus("拍照失敗，請再試一次。")
            return
        }
        const file = new File([blob], `room-photo-${Date.now()}.jpg`, { type: "image/jpeg" })
        updatePreview(file)
        closeCameraModal()
    }
}

function handleFileSelection(event) {
    const file = event.target.files[0]
    if (!file) return
    updatePreview(file)
}

function setActivePreset(presetKey) {
    selectedPreset = presetKey
    const presetButtons = document.querySelectorAll(".preset-button")
    let styleName = ""
    
    presetButtons.forEach((button) => {
        const isActive = button.dataset.preset === presetKey
        button.classList.toggle("active", isActive)
        if (isActive) {
            const strongTag = button.querySelector("strong")
            if (strongTag) styleName = strongTag.textContent.trim()
        }
    })

    const stylePreview = document.getElementById("stylePreview")
    const stylePreviewImg = document.getElementById("stylePreviewImg")
    if (stylePreview && stylePreviewImg && styleName) {
        stylePreviewImg.onerror = () => { stylePreview.style.display = "none" }
        stylePreviewImg.onload = () => { stylePreview.style.display = "block" }
        stylePreviewImg.src = `images/${styleName}.png`
    }
}

window.addEventListener("beforeunload", stopCameraStream)

async function generateImage() {
    const apiKeyInput = document.getElementById("apiKeyInput")
    const providerSelect = document.getElementById("providerSelect")
    const promptInput = document.getElementById("promptInput")
    const generateButton = document.getElementById("generateButton")
    const resultImage = document.getElementById("resultImage")
    const resultPlaceholder = document.getElementById("resultPlaceholder")

    if (!apiKeyInput || !providerSelect) return
    const apiKey = apiKeyInput.value
    const provider = providerSelect.value
    const model = provider === "azure" ? "gpt-image-2" : "gpt-image-1"
    const prompt = promptInput ? promptInput.value.trim() : ""
    const file = selectedFile

    if (!apiKey) {
        alert("請輸入 OpenAI API Key")
        return
    }
    if (!file) {
        alert("請上傳圖片")
        return
    }

    try {
        if (generateButton) {
            generateButton.disabled = true
            generateButton.textContent = "生成中..."
        }
        setStatus("正在上傳圖片並生成風格圖...")

        const presetPrompt = presetPrompts[selectedPreset]
        const fullPrompt = [presetPrompt, prompt].filter(Boolean).join(", ")

        let response, data
        if (provider === "azure") {
            const formData = new FormData()
            formData.append("model", model)
            formData.append("image", file)
            formData.append("quality", "low")
            formData.append("n", "1")
            formData.append("prompt", `CRITICAL INSTRUCTION: Analyze the provided room image and preserve its EXACT geometry, structural layout, bounding boxes, object placements, perspective, and room dimensions. Do not move, add, or remove windows, walls, doors, or key pieces of furniture. YOUR ONLY TASK is to change the surface materials, textures, lighting, and decorative style to match the following description:\n\n${fullPrompt}\n\nMaintain 100% of the original spatial composition. ultra realistic, photorealistic, interior design, architecture visualization, 4k. \nAVOID / NEGATIVE: distorted, messy, low resolution, blurry, dark, deformed furniture, extra legs on chairs, weird shadows, cluttered, ugly, low quality.`)
            formData.append("size", "1024x1024")

            response = await fetch(FIXED_AZURE_OPENAI_URL, {
                method: "POST",
                headers: {
                    "api-key": apiKey
                },
                body: formData
            })
        } else {
            const formData = new FormData()
            formData.append("model", model)
            formData.append("image", file)
            formData.append("quality", "low")
            formData.append("n", "1")
            formData.append("prompt", `CRITICAL INSTRUCTION: Analyze the provided room image and preserve its EXACT geometry, structural layout, bounding boxes, object placements, perspective, and room dimensions. Do not move, add, or remove windows, walls, doors, or key pieces of furniture. YOUR ONLY TASK is to change the surface materials, textures, lighting, and decorative style to match the following description:\n\n${fullPrompt}\n\nMaintain 100% of the original spatial composition. ultra realistic, photorealistic, interior design, architecture visualization, 4k. AVOID / NEGATIVE: distorted, messy, low resolution, blurry, dark, deformed furniture, extra legs on chairs, weird shadows, cluttered, ugly, low quality.`)
            formData.append("size", "1024x1024")
            response = await fetch("https://api.openai.com/v1/images/edits", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}` },
                body: formData
            })
        }

        data = await response.json()
        if (data.error) {
            alert(data.error.message)
            return
        }

        const base64Image = data.data[0].b64_json
        if (resultImage) {
            resultImage.src = `data:image/png;base64,${base64Image}`
            resultImage.style.display = "block"
        }
        const downloadButton = document.getElementById("downloadButton")
        if (downloadButton) {
            downloadButton.style.display = "block"
        }
        if (resultPlaceholder) resultPlaceholder.style.display = "none"
        setStatus("生成完成，可以再切換其他風格繼續嘗試。")

    } catch (err) {
        console.error(err)
        alert("生成失敗")
        setStatus("生成失敗，請確認 API Key 與網路狀態。")
    } finally {
        if (generateButton) {
            generateButton.disabled = false
            generateButton.textContent = "生成風格圖"
        }
    }
}