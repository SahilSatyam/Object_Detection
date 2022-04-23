<h1 align="center">
     AI Project
</h1>

## Object Detection Using Deep Learning

--prototxt : The path to the Caffe prototxt file.<br>
--model : The path to the pre-trained model.<br>
--confidence : The minimum probability threshold to filter weak detections. The default is 20%.<br>

To build our deep learning-based real-time object detector with OpenCV we’ll need to access our webcam/video stream in an efficient manner and apply object detection to each frame.<br>


The command to run the program:<br>
python real_time_object_detection.py --prototxt MobileNetSSD_deploy.prototxt.txt --model MobileNetSSD_deploy.caffemodel

![image](https://user-images.githubusercontent.com/54464202/164868920-a4813906-afd2-4dcf-ba5e-b92f16d56f95.png)





