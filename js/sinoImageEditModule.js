/**
*  Introduction：图片编辑器,包括在线图片上传，裁剪，旋转，水印（文字和图片）等操作，最终上传到服务器
 * Time：2016-6-15
 * By:北京华夏太和
* */
window.sinoImageEditModule = (function () {
    var watermarkTextLeft= 0,watermarkTextTop= 0, watermarkTextWidth=100,watermarkTextHeigh=30;//水印文字左边缘，上边缘，宽和高
    var watermarkImageLeft= 0,watermarkImageTop= 0,watermarkImageWidth=100,watermarkImageHeight=100;//水印图片左边缘，上边缘，宽和高
    var waterImageSrc;//水印图片路径
    var imageMoveFlag=false;//图片是否可以移动
    var textMoveFlag=false;//文字是否可以移动
    var canvasId='',watermarkImageCoverId='',watermarkImageCanvasId='',watermarkTextCoverId='',watermarkTextCanvasId='';//主图，水印图片，文字和遮罩层的ID
    var canvas,watermarkImageCanvas,watermarkTextCanvas,watermarkImageCt,watermarkCt;//主图，水印图片，文字画布，上下文对象
    var canvasBorder=0;//canvas的border,canvas合并，计算left和top位置时需要
    var imageOrignalWidth= 400,imageOrignalHeight=400;//主图原始宽和高
    var divImageCoverObj={},  divTextCoverObj={};//水印图片遮罩层，水印文字遮罩层
    var ctx = {}, img = new Image(), sPoint = {},ePoint = {};//主图context,图片，起点，终点
    var imageOrignalBase64;//主图原始base64
    var loadtimes=0; //0表示还没有上传图片，1表示第一次上传，其他表示加载多次
    var hasWaterImage=false;//是否有水印图片
    var hasWatermarkText=false;//是否有水印文字
    var rotateTimes=0;//旋转次数


    /**
     * 初始化
     * @param param (canvasId 主图画布ID,imageCoverId 水印图片的遮罩层ID,imageCanvasId 水印图片的画布ID,textCoverId 水印文字的遮罩层ID,textCanvasId 水印文字的画布ID)
     */
    var init=function(param) {
        canvasId=param.canvasId;
        watermarkImageCoverId=param.imageCoverId;
        watermarkImageCanvasId=param.imageCanvasId;
        watermarkTextCoverId=param.textCoverId;
        watermarkTextCanvasId=param.textCanvasId;
        divTextCoverObj=document.getElementById(watermarkTextCoverId);
        divImageCoverObj=document.getElementById(watermarkImageCoverId);
        canvas=document.getElementById(canvasId);
        watermarkImageCanvas=document.getElementById(watermarkImageCanvasId);
        watermarkTextCanvas=document.getElementById(watermarkTextCanvasId);
        watermarkImageCt=watermarkImageCanvas.getContext("2d");
        watermarkCt=watermarkTextCanvas.getContext("2d");
        canvasBorder=parseInt(canvas.style.borderTop);
        ctx = canvas.getContext("2d");
        canvas.addEventListener('dragover', function (e) {
            e.preventDefault(); //阻止默认事件
        }, false);
        canvas.addEventListener('drop', function (e) {
            var that=this;
            e.preventDefault(); // 阻止默认事件
            loadtimes=0;
            var file = e.dataTransfer.files[0]; //获取文件
            var reader = new FileReader();
            reader.onload = function(e) {
                img.src = this.result;  // this.result 为base64
                imageOrignalBase64=this.result;
                var  ctx = that.getContext("2d");
                img.onload = function () {
                    if(  ++loadtimes==1)
                    {
                        imageOrignalWidth=img.width;
                        imageOrignalHeight=img.height;
                    }
                    canvas.width=img.width;
                    canvas.height=img.height;
                    ctx.drawImage(img, 0, 0,canvas.width,canvas.height);
                    //绑定mousedown事件
                    canvas.addEventListener('mousedown', function (e) {
                        if (e.button === 0) {
                            sPoint.x = e.offsetX;
                            sPoint.y = e.offsetY;
                            sPoint.drag = true;
                        }
                        else  if (e.button === 1) {
                            e.preventDefault();
                            noCover();
                        }
                    });
                    //绑定mousemove事件
                    canvas.addEventListener('mousemove', function (e) {
                        if(e.button === 0 && sPoint.drag) {
                            var nPoint = {
                                x: e.offsetX,
                                y: e.offsetY
                            };
                            ctx.save();    //clip要通过restore回复
                            drawImage();    //绘制底图
                            drawCover();    //绘制阴影
                            ctx.beginPath();    //开始路径
                            ctx.rect(sPoint.x, sPoint.y, nPoint.x - sPoint.x, nPoint.y - sPoint.y);    //设置路径为选取框
                            ctx.clip();    //截取路径内为新的作用区域
                            drawImage();    //在选取框内绘制底图
                            ctx.restore();    //恢复clip截取的作用范围
                        }
                    });
                    //绑定mouseup事件
                    canvas.addEventListener('mouseup', function (e) {
                        if (e.button === 0) {
                            sPoint.drag = false;
                            ePoint.x = e.offsetX;
                            ePoint.y = e.offsetY;
                        } else if (e.button === 2) {
                            restore();
                        }
                    });
                };
            };
            reader.readAsDataURL(file);
        }, false);
    };


    /**
     * 合并水印（图片，文字），保存到画布
     * @param type 1主图，2水印图片，3水印文字
     * @param callback 回调函数
     */
    var saveCanvas=function (type,callback) {
        if(getValide(type)<0)
        {
            return;
        }
        var state=1;//state状态码，-1表示没有添加水印图片，-2表示没有添加水印文字,-3表示没有上传图片
        var msg='';
        switch (type)
        {
            case 3:
                if(!watermarkTextCanvas)
                {
                    state=-2;
                    break;
                }
                ctx.drawImage(watermarkTextCanvas,watermarkTextLeft-canvasBorder,watermarkTextTop-canvasBorder);
                divTextCoverObj.style.display='none';
                hasWatermarkText=false;
                break;
            case 2:
                if(!watermarkImageCanvas)
                {
                    state=-1;
                    break;
                }
                ctx.drawImage(watermarkImageCanvas,watermarkImageLeft-canvasBorder,watermarkImageTop-canvasBorder);
                watermarkImageCanvas.style.display='none';
                hasWaterImage=false;
                break;
            case 1:
                if(!canvas)
                {
                    state=-3;
                    break;
                }

        }
        img.src = canvas.toDataURL("image/png");
        drawImage();
        if(callback)
            callback(state);
    };


    /**
     * 把图片绘制到canvas上
     */
    var drawImage=function () {
            ctx.drawImage(img, 0, 0,canvas.width,canvas.height);
       };


    /**
    * 去除裁剪时主图的背景色
    * */
    var noCover=function () {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    };


    /**
    * 画裁剪时的背景色
    * */
    var drawCover=function () {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        };


    /**
     * 重新加载图片
     */
    var  restore=function () {
            sPoint = {};
            ePoint = {};
            drawImage();
        };


    /**
     * 裁剪
     * @param e
     */
    var imageCut = function (e) {
        if(getValide(1)<0)
            return;
         if (sPoint.x !== undefined && ePoint.x !== undefined) {
            var cutWidth=ePoint.x - sPoint.x;
            var cutHeight=ePoint.y - sPoint.y;
            var imgData = ctx.getImageData(sPoint.x, sPoint.y, cutWidth, cutHeight);    //把裁剪区域的图片信息提取出来
            ctx.clearRect(0, 0, canvas.width, canvas.height);    //清空画布
            canvas.width = Math.abs(ePoint.x - sPoint.x);    //重置canvas的大小为新图的大小
            canvas.height = Math.abs(ePoint.y - sPoint.y);

            ctx.putImageData(imgData, 0, 0);    //把提取出来的图片信息放进canvas中
            img.src = canvas.toDataURL();    //裁剪后我们用新图替换底图，方便继续处理
            img.width=cutWidth;
            img.height=cutHeight;
            sPoint.x = undefined ; ePoint.x = undefined;
        }
        else {
            alert('没有选择区域');
        }
    };


    /**
     * 图片旋转
     * @param degree 旋转角度，正值顺时针，负值逆时针
     */
    var imageRotation=function (degree){
        if(getValide(1)<0)
            return;
        rotateTimes++;
        var xpos = canvas.width/2;
        var ypos = canvas.height/2;
        ctx.clearRect(0, 0,  canvas.width, canvas.height);
        ctx.save();
        ctx.translate(xpos, ypos);
        ctx.rotate((degree*rotateTimes%360) * Math.PI / 180);
        ctx.translate(-xpos, -ypos);
        ctx.drawImage(img, xpos - img.width / 2, ypos - img.height / 2);
        ctx.restore();
    };


    /**
     * 图片水印
     * @param src 图片路径
     * @param opcity 透明度
     * @param left 图片left
     * @param top 图片top
     * @param width 宽
     * @param height 高
     * @param callback 回调函数
     */
    var imageWatermark = function (src,opcity,left,top,width,height,callback) {
        hasWaterImage=true;
        if(getValide(2)<0)
           return;

        divImageCoverObj.style.display='block';
        waterImageSrc=src;
        watermarkImageLeft=left;
        watermarkImageTop=top;

        watermarkImageCanvas.style.display='block';

        divImageCoverObj.style.width=width+"px";
        divImageCoverObj.style.height=height+"px";
        divImageCoverObj.style.left=left+"px";
        divImageCoverObj.style.top=top+"px";
        watermarkImageCanvas.width=width;
        watermarkImageCanvas.height=height;
        watermarkImageCt.globalAlpha= opcity;
        divImageCoverObj.onmousedown=function(e){
            imageMoveFlag=true;
            var clickEvent=e;
            watermarkImageWidth=clickEvent.clientX-divImageCoverObj.offsetLeft;
            watermarkImageHeight=clickEvent.clientY-divImageCoverObj.offsetTop;
        };
        divImageCoverObj.onmousemove=function(e){
            var moveEvent=e;
            if(imageMoveFlag){
                divImageCoverObj.style.left=moveEvent.clientX-watermarkImageWidth+"px";
                divImageCoverObj.style.top=moveEvent.clientY-watermarkImageHeight+"px";
                //下面四个条件为限制div以及图像的活动边界
                if(moveEvent.clientX<=watermarkImageWidth){
                    divImageCoverObj.style.left=0+"px";
                }
                if(parseInt(divImageCoverObj.style.left)+divImageCoverObj.offsetWidth >=canvas.width){
                    divImageCoverObj.style.left=canvas.width - divImageCoverObj.offsetWidth+"px";
                }
                if(moveEvent.clientY<=watermarkImageHeight){
                    divImageCoverObj.style.top=0+"px";
                }
                if(parseInt(divImageCoverObj.style.top)+divImageCoverObj.offsetHeight>=canvas.height){
                    divImageCoverObj.style.top=canvas.height-divImageCoverObj.offsetHeight+"px";
                }
                watermarkImageLeft=parseInt(divImageCoverObj.style.left);
                watermarkImageTop=parseInt(divImageCoverObj.style.top);
                if(callback)
                    callback(watermarkImageLeft,watermarkImageTop);
            }
        }
        divImageCoverObj.onmouseup=function(e)
        {
            imageMoveFlag=false;
        }
        redrawWatermarkImage(width,height);
    };


    /**
     * 水印图片重画
     * @param width 图片宽
     * @param height 图片高
     */
    var redrawWatermarkImage=function (width,height){
        watermarkImageCt.clearRect(0,0,watermarkImageCanvas.width,watermarkImageCanvas.height);
        var newImgs = new Image();
        // 加载图片，完成后执行
        newImgs.onload=function()
        {
            watermarkImageCt.drawImage(newImgs,0,0,width,height);
        }
        newImgs.src = waterImageSrc
    };


    /**
     *  设置图片尺寸
     * @param width 宽
     * @param height 高
     */
    var setSize=function(width,height) {
        if(getValide(1)<0)
            return;
        if(!width)
        {
            width=imageOrignalWidth;
            height=imageOrignalHeight;
        }
        var sx=1.0*width/ canvas.width;
        var sy=1.0*height/canvas.height;
        ctx.save();
        canvas.width=width;
        canvas.height=height;
        ctx.scale(sx,sy);

        img.src=imageOrignalBase64;
        img.width=width;
        img.height=height;
        ctx.drawImage(img,0,0);
        ctx.restore();
    };


    /**
     * 是否有效，返回-1表示没有主图,1表示有效
     * @param type 类型，1主图，2水印图片，3水印文字
     * @returns {number}
     */
    var getValide= function (type) {
        var state=1;
        if(!imageOrignalBase64)
        {
            state=-1;
            alert('请先上传图片');
        }
        else
        {
            switch (type)
            {
                case 2:
                    if(!hasWaterImage)
                    {
                        state=-2;
                        alert('请先添加水印图片');
                    }
                    break;
                case 3:
                    if(!hasWatermarkText)
                    {
                        state=-3;
                        alert('请先添加水印文字');
                    }
                    break;
            }
        }

    return state;
};

    /**
     * 文字水印
     * @param opcity 透明度
     * @param txt 文本
     * @param font 字体
     * @param style 样式
     * @param left 遮罩层左边缘
     * @param top 遮罩层上边缘
     * @param width 遮罩层宽
     * @param height 遮罩层高
     * @param textLeft 文本距离遮罩层左边缘
     * @param TextTop 文本距离遮罩层上边缘
     * @param callback 回调函数
     */
    var textWatermark = function (opcity,txt,font,style,left,top,width,height,textLeft,TextTop,callback) {
        hasWatermarkText=true;
        if(getValide(3)<0)
            return;

        divTextCoverObj.style.display='block';
        watermarkTextLeft=left;
        watermarkTextTop=top;


        watermarkTextCanvas.width=width;
        watermarkTextCanvas.height=height;
        divTextCoverObj.style.width=width+"px";
        divTextCoverObj.style.height=height+"px";
        divTextCoverObj.style.left=left+"px";
        divTextCoverObj.style.top=top+"px";
        divTextCoverObj.onmousedown=function(e){
            textMoveFlag=true;
            var clickEvent=e;
            watermarkTextWidth=clickEvent.clientX-divTextCoverObj.offsetLeft;
            watermarkTextHeight=clickEvent.clientY-divTextCoverObj.offsetTop;
        };
        divTextCoverObj.onmousemove=function(e){
            var moveEvent=e;
            if(textMoveFlag){
                divTextCoverObj.style.left=moveEvent.clientX-watermarkTextWidth+"px";
                divTextCoverObj.style.top=moveEvent.clientY-watermarkTextHeight+"px";
                //下面四个条件为限制div以及图像的活动边界
                if(moveEvent.clientX<=watermarkTextWidth){
                    divTextCoverObj.style.left=0+"px";
                }
                if(parseInt(divTextCoverObj.style.left)+divTextCoverObj.offsetWidth >=canvas.width){
                    divTextCoverObj.style.left=canvas.width - divTextCoverObj.offsetWidth+"px";
                }
                if(moveEvent.clientY<=watermarkTextHeight){
                    divTextCoverObj.style.top=0+"px";
                }
                if(parseInt(divTextCoverObj.style.top)+divTextCoverObj.offsetHeight>=canvas.height){
                    divTextCoverObj.style.top=canvas.height-divTextCoverObj.offsetHeight+"px";
                }
                watermarkTextLeft=parseInt(divTextCoverObj.style.left);
                watermarkTextTop=parseInt(divTextCoverObj.style.top);
                if(callback)
                    callback(watermarkTextLeft,watermarkTextTop);
            }
        }
        divTextCoverObj.onmouseup=function(e) {
            textMoveFlag=false;
        }
        reDrawText(txt,opcity,font,style,textLeft,TextTop);




};


    /**
     * 重画文本
     * @param txt 文本
     * @param opcity 透明度
     * @param font 字体
     * @param style 样式
     * @param left 文本相对主图左边缘
     * @param top 文本相对主图上边缘
     */
    var reDrawText=function(txt,opcity,font,style,left,top) {
        watermarkCt.clearRect(0, 0, canvas.width, canvas.height);
        drawImage();
        watermarkCt.globalAlpha= opcity;
        watermarkCt.font=font;
        watermarkCt.fillStyle = style;
        watermarkCt.fillText(txt,left,top);
    };


    /**
     * 保存到服务端
     * @param savePath 保存路径
     * @param func  回调函数
     */
    var saveImage = function (savePath,func) {
        if(getValide(1)<0)
            return;
        var data = canvas.toDataURL();
        //删除字符串前的提示信息 "data:image/png;base64,"
        var b64 =data.substring(22);
        $.ajax({
            type: 'POST',
            url:savePath,
            data: {imageData:b64},
            dataType: 'json',
            success: function (response) {
              if(func)
                 func(response);
            }
        });
    };

    return {
        init:init,
        imageCut: imageCut,
        setSize:setSize,
        imageRotation:imageRotation,
        saveImage:saveImage,
        imageWatermark: imageWatermark,
        textWatermark: textWatermark,
        saveCanvas:saveCanvas
    };

})();