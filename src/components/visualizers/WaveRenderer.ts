// File: src/components/visualizers/WaveRenderer.ts

export class WaveRenderer {
  private timeOffset = 0;

  public renderWave(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    // Calculate average amplitude for dynamic effects
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 40;
    
    // Vibrant gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, `hsla(${260 + hueShift}, 75%, 22%, 0.92)`);
    bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 70%, 20%, 0.92)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.timeOffset += 0.05;

    const centerY = canvas.height / 2;
    const sliceWidth = canvas.width / data.length;

    // Draw multiple wave layers for depth
    const layers = [
      { offset: 0, color: 'rgba(138, 43, 226, 0.6)', width: 3, amplitude: 0.8 },
      { offset: 5, color: 'rgba(75, 0, 130, 0.4)', width: 2, amplitude: 0.6 },
      { offset: -5, color: 'rgba(147, 112, 219, 0.4)', width: 2, amplitude: 0.6 },
    ];

    layers.forEach((layer) => {
      ctx.lineWidth = layer.width;
      ctx.strokeStyle = layer.color;
      ctx.shadowBlur = 20 + avgAmplitude * 30;
      ctx.shadowColor = layer.color;

      ctx.beginPath();
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const value = data[i] ?? 128;
        const normalizedValue = ((value - 128) / 128) * layer.amplitude;
        const y = centerY + normalizedValue * (canvas.height / 2.5) + Math.sin(this.timeOffset + i * 0.1) * 5;

        if (i === 0) {
          ctx.moveTo(x, y + layer.offset);
        } else {
          ctx.lineTo(x, y + layer.offset);
        }
        x += sliceWidth;
      }

      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // Add glow particles along the wave
    ctx.fillStyle = 'rgba(200, 150, 255, 0.8)';
    for (let i = 0; i < data.length; i += 10) {
      const value = data[i] ?? 128;
      const normalizedValue = ((value - 128) / 128) * 0.8;
      const x = i * sliceWidth;
      const y = centerY + normalizedValue * (canvas.height / 2.5);

      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(200, 150, 255, 1)';
      ctx.beginPath();
      ctx.arc(x, y, 2 + avgAmplitude * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  public renderOscilloscope(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    // Grid background
    this.drawGrid(ctx, canvas);

    const centerY = canvas.height / 2;
    const sliceWidth = canvas.width / data.length;

    // Main oscilloscope line
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(0, 255, 200, 0.8)';

    ctx.beginPath();
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i] ?? 128;
      const normalizedValue = ((value - 128) / 128);
      const y = centerY + normalizedValue * (canvas.height / 2.2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow trail
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.2)';
    ctx.shadowBlur = 40;
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  public renderWaveformMirror(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    // Calculate average for dynamic effects
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 35;
    
    // Vibrant gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, `hsla(${270 + hueShift}, 80%, 24%, 0.92)`);
    bgGradient.addColorStop(0.5, `hsla(${250 + hueShift}, 75%, 20%, 0.95)`);
    bgGradient.addColorStop(1, `hsla(${270 + hueShift}, 80%, 24%, 0.92)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const sliceWidth = canvas.width / data.length;

    // Draw center line
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // Top waveform
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.7 + avgAmplitude * 0.3})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.8)';

    ctx.beginPath();
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i] ?? 128;
      const normalizedValue = ((value - 128) / 128);
      const y = centerY - Math.abs(normalizedValue) * (canvas.height / 2.3);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.stroke();

    // Bottom waveform (mirror)
    ctx.strokeStyle = `rgba(75, 0, 130, ${0.7 + avgAmplitude * 0.3})`;
    ctx.shadowColor = 'rgba(75, 0, 130, 0.8)';

    ctx.beginPath();
    x = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i] ?? 128;
      const normalizedValue = ((value - 128) / 128);
      const y = centerY + Math.abs(normalizedValue) * (canvas.height / 2.3);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.stroke();

    // Fill between waveforms
    ctx.globalAlpha = 0.15;
    const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fillGradient.addColorStop(0, 'rgba(138, 43, 226, 0.4)');
    fillGradient.addColorStop(0.5, 'rgba(106, 21, 197, 0.6)');
    fillGradient.addColorStop(1, 'rgba(75, 0, 130, 0.4)');
    ctx.fillStyle = fillGradient;

    ctx.beginPath();
    x = 0;
    for (let i = 0; i < data.length; i++) {
      const value = data[i] ?? 128;
      const normalizedValue = ((value - 128) / 128);
      const y = centerY - Math.abs(normalizedValue) * (canvas.height / 2.3);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    for (let i = data.length - 1; i >= 0; i--) {
      const value = data[i] ?? 128;
      const normalizedValue = ((value - 128) / 128);
      const y = centerY + Math.abs(normalizedValue) * (canvas.height / 2.3);
      x -= sliceWidth;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 0;
  }

  private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Vibrant grid background
    const gridGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gridGradient.addColorStop(0, 'hsla(200, 70%, 18%, 0.92)');
    gridGradient.addColorStop(1, 'hsla(220, 65%, 15%, 0.92)');
    ctx.fillStyle = gridGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const gridSpacingX = canvas.width / 10;
    for (let x = 0; x <= canvas.width; x += gridSpacingX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal grid lines
    const gridSpacingY = canvas.height / 6;
    for (let y = 0; y <= canvas.height; y += gridSpacingY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Center line (brighter)
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
}
