import * as posenet from '@tensorflow-models/posenet';
import { drawKeypoints, drawSkeleton, drawBoundingBox, drawSuit, loadSuit } from './util'

const videoWidth = 600;
const videoHeight = 500;

async function setupCamera(): Promise<HTMLVideoElement> {
  const video = document.getElementById('video') as HTMLVideoElement;
  video.width = videoWidth;
  video.height = videoHeight;
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: videoWidth,
      height: videoHeight,
    },
  });
  video.srcObject = stream;
  return new Promise( resolve => {
    video.onloadedmetadata = () => {
      video.play();
      resolve(video);
    };
  });
}

function detectPoseInRealTime(video: HTMLVideoElement, net: posenet.PoseNet, suit: HTMLImageElement) {
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    const minPoseConfidence = 0.15;
    const minPartConfidence = 0.1;
    
    const poses = await net.estimatePoses(video, {
      flipHorizontal: true,
      decodingMethod: 'single-person'
    });
    console.log(poses)
    
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    ctx.restore();

    const {score, keypoints} = poses[0]
    if (score >= minPoseConfidence) {
      //drawKeypoints(keypoints, minPartConfidence, ctx);
      //drawSkeleton(keypoints, minPartConfidence, ctx);
      //drawBoundingBox(keypoints, ctx);
      drawSuit(keypoints, ctx, suit);
    }

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}


async function main() {
  try {
    const net = await posenet.load({
      architecture: 'ResNet50',
      outputStride: 32,
      inputResolution: 200,
      multiplier: 1,
      quantBytes: 2,
    });
    const loading = document.getElementById("loading-overlay");
    const video = await setupCamera();
    const suit = await loadSuit()
    loading.style.display = 'none';
    detectPoseInRealTime(video, net, suit);
  } catch (e) {
    alert(e);
    throw e;
  } 
}

main();