# myCrawl
玩一下爬虫

启动

```js
node crawl.js
```


## 实现

- 爬图片
- 监听成功、失败条数
- 记录失败的日志

引入 **colors** 模块，这个可以设置 node.js 控制台的颜色和样式。



### 关于去除水印

网上搜了一圈，都是利用 Python + OpenCV

核心算法：

```python
#coding=utf-8
#图片修复

import cv2
import numpy as np

path = "img/inpaint.png"

img = cv2.imread(path)
hight, width, depth = img.shape[0:3]

#图片二值化处理，把[240, 240, 240]~[255, 255, 255]以外的颜色变成0
thresh = cv2.inRange(img, np.array([240, 240, 240]), np.array([255, 255, 255]))

#创建形状和尺寸的结构元素
kernel = np.ones((3, 3), np.uint8)

#扩张待修复区域
hi_mask = cv2.dilate(thresh, kernel, iterations=1)
specular = cv2.inpaint(img, hi_mask, 5, flags=cv2.INPAINT_TELEA)

cv2.namedWindow("Image", 0)
cv2.resizeWindow("Image", int(width / 2), int(hight / 2))
cv2.imshow("Image", img)

cv2.namedWindow("newImage", 0)
cv2.resizeWindow("newImage", int(width / 2), int(hight / 2))
cv2.imshow("newImage", specular)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

