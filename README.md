# ImageEdit
图片编辑器,包括在线图片上传，裁剪，旋转，水印（文字和图片）等操作，最终上传到服务器
## //初始化操作，主图片画布，水印图片遮罩层，水印图片画布，水印文本遮罩层，水印文本画布
        sinoImageEditModule.init({
            canvasId:'canvas',
            imageCoverId:'imageCover',
            imageCanvasId:'watermarkImageCanvas',
            textCoverId:'textCover',
            textCanvasId:'watermarkTextCanvas',
        });
