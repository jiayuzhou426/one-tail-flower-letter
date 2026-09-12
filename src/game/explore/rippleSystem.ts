export type Ripple = { x: number; y: number; age: number; life: number; size: number; rings: number };
type RippleOptions = Partial<Pick<Ripple, 'life' | 'size' | 'rings'>>;

export class RippleSystem {
  ripples: Ripple[] = [];
  private next = 0.2;

  add(x: number, y: number, options: RippleOptions = {}) {
    this.ripples.push({
      x,
      y,
      age: 0,
      life: options.life ?? 0.8 + Math.random() * 1.05,
      size: options.size ?? 3 + Math.random() * 8,
      rings: options.rings ?? (Math.random() < 0.35 ? 1 : Math.random() < 0.75 ? 2 : 3),
    });
    if (this.ripples.length > 12) this.ripples.splice(0, this.ripples.length - 12);
  }

  update(dt: number, width: number, height: number, open: (x: number, y: number) => boolean, ambient = true) {
    this.next -= dt;
    if (ambient && this.next <= 0) {
      let attempts = 0;
      while (attempts < 8) {
        const x = width * (0.12 + Math.random() * 0.76);
        const y = height * (0.1 + Math.random() * 0.78);
        if (open(x, y)) {
          this.add(x, y);
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
