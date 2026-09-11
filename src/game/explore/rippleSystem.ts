export type Ripple = { x: number; y: number; age: number; life: number; size: number; rings: number };

export class RippleSystem {
  ripples: Ripple[] = [];
  private next = 0.2;

  update(dt: number, width: number, height: number, open: (x: number, y: number) => boolean) {
    this.next -= dt;
    if (this.next <= 0) {
      let attempts = 0;
      while (attempts < 8) {
        const x = width * (0.12 + Math.random() * 0.76);
        const y = height * (0.1 + Math.random() * 0.78);
        if (open(x, y)) {
          this.ripples.push({ x, y, age: 0, life: 0.8 + Math.random() * 1.05, size: 3 + Math.random() * 8, rings: Math.random() < 0.35 ? 1 : Math.random() < 0.75 ? 2 : 3 });
          break;
        }
        attempts += 1;
      }
      this.next = 0.28 + Math.random() * 0.62;
    }
    for (let index = this.ripples.length - 1; index >= 0; index -= 1) {
      const ripple = this.ripples[index];
      ripple.age += dt;
      if (ripple.age >= ripple.life) this.ripples.splice(index, 1);
    }
    if (this.ripples.length > 12) this.ripples.splice(0, this.ripples.length - 12);
  }
}
