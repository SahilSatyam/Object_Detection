# Real-time-object-detection-with-deep-learning-and-OpenCV
This project is the implementation of Real-time Object detection in video with deep learning and OpenCV.

--prototxt : The path to the Caffe prototxt file.<br>
--model : The path to the pre-trained model.<br>
--confidence : The minimum probability threshold to filter weak detections. The default is 20%.<br>



To build our deep learning-based real-time object detector with OpenCV we’ll need to 
1. access our webcam/video stream in an efficient manner and 
2. apply object detection to each frame.

The command to run the program:<br>
python real_time_object_detection.py --prototxt MobileNetSSD_deploy.prototxt.txt --model MobileNetSSD_deploy.caffemodel


![Screenshot (691)](https://user-images.githubusercontent.com/68952200/164609058-a75ec476-d17c-4528-9265-4d2ff248e709.png)





