let video;
let poseNet;
let pose;

let leftOsc, rightOsc, noseOsc; //Oscillators

let reverb, delay, distortion, filter; //Audio effects

let scale = ['Ab', 'Bb', 'C', 'Eb', 'F']; //Pentatonic scale

// //Defining the frequency of the Ab Major chord
// const notes = {
//   Ab: 415.30,
//   A: 440.00,
//   Bb: 466.16,
//   B: 493.88,
//   Db: 554.37,
//   Eb: 622.25,
//   E: 659.25,
//   Gb: 739.99,
//   G: 783.99,
// };

// //Setting the frequency of the Ab Major chord
const notes = {
  Ab: 207.65,
  A: 220.00,
  Bb: 233.08,
  B: 246.94,
  Db: 277.18,
  Eb: 311.13,
  E: 329.63,
  Gb: 369.99,
  G: 391.99,
};

let leftEnv, rightEnv, noseEnv;

//Setting the ADSR parameters for each oscillator
const leftADSR = {
  attackTime: 3,
  decayTime: 2,
  sustainLevel: 0.0,
  releaseTime: 20,
};

const rightADSR = {
  attackTime: 3,
  decayTime: 2,
  sustainLevel: 0.5,
  releaseTime: 40,
};

const noseADSR = {
  attackTime: 10,
  decayTime: 2,
  sustainLevel: 0.2,
  releaseTime: 60,
};

let noseFreq, leftWristFreq, rightWristFreq;

//Smoothing data parameters
let smoothedPose = {};
const smoothingFactor = 0.24;

let particles = [];

function setup() {
  createCanvas(640, 360);

  //Webcam capture
  video = createCapture(VIDEO);
  video.hide();

  //Initialising PoseNet with the webcam
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  //Initialising the oscillators
  leftOsc = new p5.Oscillator('sine');
  rightOsc = new p5.Oscillator('sine');
  noseOsc = new p5.Oscillator('triangle');

  //Initialising the ADSR
  leftEnv = new p5.Envelope();
  rightEnv = new p5.Envelope();
  noseEnv = new p5.Envelope();

  //Setting the ADSR
  leftEnv.setADSR(leftADSR.attackTime, leftADSR.decayTime, leftADSR.sustainLevel, leftADSR.releaseTime);
  rightEnv.setADSR(rightADSR.attackTime, rightADSR.decayTime, rightADSR.sustainLevel, rightADSR.releaseTime);
  noseEnv.setADSR(noseADSR.attackTime, noseADSR.decayTime, noseADSR.sustainLevel, noseADSR.releaseTime);

  //Setting the initial frequencies
  leftOsc.freq(notes.Ab);
  rightOsc.freq(notes.A);
  noseOsc.freq(notes.B);

  //Starting the oscillators
  leftOsc.start();
  rightOsc.start();
  noseOsc.start();

  //Configuring the envelope
  leftOsc.amp(leftEnv);
  rightOsc.amp(rightEnv);
  noseOsc.amp(noseEnv);

  //Starting the envelopes
  leftEnv.play();
  rightEnv.play();
  noseEnv.play();

  //Initialising and assigning audio effects and filters
  reverb = new p5.Reverb();
  reverb.process(leftOsc, 4, 2);
  delay = new p5.Delay();
  delay.process(rightOsc);
  distortion = new p5.Distortion();
  distortion.process(noseOsc);
  filter = new p5.Filter();
  filter.setType("bandpass");
  // noseOsc.connect(filter);
  filter.process(noseOsc);

  //Initialising smoothedPose with initial values
  //Error: smoothedPose not being initialised before the smoothposedata function
  smoothedPose = {
    nose: { x: 0, y: 0 },
    leftWrist: { x: 0, y: 0 },
    rightWrist: { x: 0, y: 0 }
  };
}

function gotPoses(poses) {
  //console.log(poses);
  if(poses.length > 0) {
    pose = poses[0].pose;
  }
}

function modelLoaded() {
  console.log('PoseNet loaded');
}

function smoothPoseData(newPose) {
  if (!pose) {
    //Setting smoothedPose to newPose if there isn't a detected pose
    smoothedPose = newPose;
  } else {
    //Smoothing each pose parameter separately
    smoothedPose.nose = {
      x: lerp(smoothedPose.nose.x, newPose.nose.x, smoothingFactor),
      y: lerp(smoothedPose.nose.y, newPose.nose.y, smoothingFactor)
    };
    smoothedPose.leftWrist = {
      x: lerp(smoothedPose.leftWrist.x, newPose.leftWrist.x, smoothingFactor),
      y: lerp(smoothedPose.leftWrist.y, newPose.leftWrist.y, smoothingFactor)
    };
    smoothedPose.rightWrist = {
      x: lerp(smoothedPose.rightWrist.x, newPose.rightWrist.x, smoothingFactor),
      y: lerp(smoothedPose.rightWrist.y, newPose.rightWrist.y, smoothingFactor)
    };
  }
}

function mapPoseToScale(pos, scale) {
  //Mapping the pose position to the scale
  let index = floor(map(pos, 0, width, 0, scale.length));
  let note = scale[index % scale.length];
  return notes[note];
}

function draw() {
noStroke();
//image(video, 0, 0);
background(0, 10);

//Two particle emitters, one for each hand
for(let i = 0; i < 1; i++) {
  let p = new Particle(smoothedPose.leftWrist.x, smoothedPose.leftWrist.y);
  particles.push(p);
}

for(let i = 0; i < 1; i++) {
  let p = new Particle(smoothedPose.rightWrist.x, smoothedPose.rightWrist.y);
  particles.push(p);
}

for(let i = particles.length - 1; i >= 0; i--) {
  particles[i].show(leftWristFreq, rightWristFreq, noseFreq);
  particles[i].update(leftWristFreq, rightWristFreq);
  if(particles[i].lifetime()) {
    particles.splice(i, 1);
  }
}

if(pose) {
  //Smoothing the data
  smoothPoseData(pose);

  let leftEye = pose.leftEye;
  let rightEye = pose.rightEye;
  //Introducing a z parameter
  let distance = dist(leftEye.x, leftEye.y, rightEye.x, rightEye.y);

  //Mapping pose positions to frequencies
  noseFreq = mapPoseToScale(smoothedPose.nose.x, scale);
  leftWristFreq = mapPoseToScale(smoothedPose.leftWrist.y, scale);
  rightWristFreq = mapPoseToScale(smoothedPose.rightWrist.y, scale);

  //Modulating the frequency and filter parameters with the nose position
  if(pose.nose.confidence > 0.4 && pose.leftEye.confidence > 0.4 && pose.rightEye.confidence > 0.4) {
    fill(180, 250, 180, 50);
    ellipse(smoothedPose.nose.x, smoothedPose.nose.y, distance);

    noseOsc.freq(noseFreq, 0.4);
    filter.freq(smoothedPose.nose.x);
    //Setting the nose oscillator distortion to increase when the user gets closer to the webcam
    distortion.set(map(distance, 0.0, 250.0, 0.0, 1.0));
  }

    //Modulating the frequency and filter parameters with the left hand position
  if(pose.leftWrist.confidence > 0.4) {
    fill(180, 180, 180, 50);
    ellipse(smoothedPose.leftWrist.x, smoothedPose.leftWrist.y, 20);

    leftOsc.freq(leftWristFreq, 0.4);
    reverb.drywet(map(smoothedPose.leftWrist.y, 0.0, 400.0, 1.0, 0.0));
  }

  //Modulating the frequency and filter parameters with the right hand position
  if(pose.rightWrist.confidence > 0.4) {
    fill(180, 180, 180, 50);
    ellipse(smoothedPose.rightWrist.x, smoothedPose.rightWrist.y, 20);

    rightOsc.freq(rightWristFreq, 0.4);
    delay.drywet(map(smoothedPose.rightWrist.y, 0.0, 400.0, 1.0, 0.0));
  }
  }
}

//Allowing the user to start the start the audio by pressing on the screen
function mousePressed() {
  leftOsc.start();
  rightOsc.start();
  noseOsc.start();
}