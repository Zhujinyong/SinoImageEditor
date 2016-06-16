# 在线图片编辑器
包括图片上传，裁剪，缩放,旋转，水印（文字和图片）等操作，最终上传到服务器，先来看看效果吧：<br>
![](https://github.com/Zhujinyong/ImageEdit/raw/master/images/overView.jpg)  
首先html中需要先添加如下div,3个canvas分别表示主图，水印图片和水印文字画布，外面套一层遮罩层（为了方便鼠标拖动）。<br>
~~~JavaSctipt
  <div style="width:600px; height:450px; overflow:auto;z-index:3;position:absolute;">
                <div>
                    <canvas id="canvas" width="400" height="400" style="border:2px solid gray;position:absolute;"></canvas>
                </div>
                <div  id='imageCover' style="width:100px; height:100px;position:absolute;cursor:pointer;display:none;z-index:4;">
                    <canvas id="watermarkImageCanvas"   width="100" height="100" style="position:absolute;"></canvas>
                </div>
                <div  id='textCover' style="width:100px; height:30px;position:absolute;cursor:pointer;z-index:5;display:none">
                    <canvas id="watermarkTextCanvas"   width="100" height="30" style="position:absolute;"></canvas>
                </div>
            </div>
~~~
div添加好了，接下来就是初始化和对图片的操作：<br>
 1.初始化操作，主图片画布，水印图片遮罩层，水印图片画布，水印文本遮罩层，水印文本画布<br>
~~~C#
   sinoImageEditModule.init({
        canvasId:'canvas',
        imageCoverId:'imageCover',
           imageCanvasId:'watermarkImageCanvas',
        textCoverId:'textCover',
        textCanvasId:'watermarkTextCanvas',
        });
~~~

2.裁剪，鼠标选择一块矩形区域裁剪<br>
~~~C#
  sinoImageEditModule.imageCut();
~~~

3.旋转，设置旋转角度（正数顺时针旋转，负数逆时针旋转）<br>
~~~C#
  sinoImageEditModule.imageRotation(document.getElementById('inputRotation').value);
~~~

4.缩放，根据宽和高缩放图片<br>
~~~C#
  sinoImageEditModule.setSize(500,300);
~~~

5.水印图片，可以鼠标移动图片，设置图片透明度，图片路径，大小等<br>
~~~C#
     sinoImageEditModule.imageWatermark(src,opcity,left,top,width,height,callback);
~~~

6.水印文字，可以鼠标移动文字，设置文字内容，透明度，大小等<br>
~~~C#
     sinoImageEditModule.textWatermark(opcity,txt,font,style,left,top,width,height,textLeft,TextTop,callback);
~~~

7.保存到服务端,POST图片base64值到远程服务器，CORS跨域保存
~~~C#
     sinoImageEditModule.saveImage('http://localhost:8055/Home/SaveImage',function(result)
            {
                if(result.State==1)
                    alert('保存成功,文件名：'+result.FileName);
                else
                    alert('保存失败');
            });
~~~
