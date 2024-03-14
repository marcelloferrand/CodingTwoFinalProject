class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    //x velocity
    this.vx = random(-1, 1);
    //y velocity
    this.vy = random(-1, 1);
    this.alpha = 255;
  }

  //Defining a lifetime to remove particles
  lifetime() {
    return this.alpha < 0;
  }

  update() {
  //Checking if the particles hit the edges of the canvas and bouncing them back
  if (this.x + this.vx < 0) {
    this.vx = -this.vx;
  } else if (this.x + this.vx > width) {
    this.vx = -this.vx;
  } else if(this.y + this.vy < 0) {
    this.vy = -this.vy;
  } else if(this.y + this.vy > height) {
    this.vy = -this.vy;
  }

  this.x += this.vx;
  this.y += this.vy;

  this.alpha -= 2;
  }

  show(leftFreq, rightFreq, noseFreq) {
    //Mapping frequency values to the colour of particles
    let r = map(leftFreq, 207.65, 391.99, 0, 255);
    let g = map(rightFreq, 207.65, 391.99, 0, 255);
    let b = map(noseFreq, 207.65, 391.99, 0, 255); // Combine frequencies for a third color component
    noStroke();
    fill(r, g, b, this.alpha);
    ellipse(this.x, this.y, 2);
  }
}