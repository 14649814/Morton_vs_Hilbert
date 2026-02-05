// ========================================
// 希尔伯特曲线算法
// ========================================
class HilbertCurve {
    constructor(order) {
        this.order = order;
        this.n = Math.pow(2, order);
        this.totalCells = this.n * this.n;
    }

    // 将一维索引转换为二维坐标
    indexToPoint(index) {
        let x = 0, y = 0;
        let s = 1;
        
        for (let i = 0; i < 2 * this.order; i++) {
            let rx = 1 & (index >> 1);
            let ry = 1 & (index ^ rx);
            
            [x, y] = this.rotate(s, x, y, rx, ry);
            x += s * rx;
            y += s * ry;
            index >>= 2;
            s *= 2;
        }
        
        return { x, y };
    }

    // 旋转/翻转象限
    rotate(n, x, y, rx, ry) {
        if (ry === 0) {
            if (rx === 1) {
                x = n - 1 - x;
                y = n - 1 - y;
            }
            [x, y] = [y, x];
        }
        return [x, y];
    }

    // 生成完整路径
    generatePath() {
        const path = [];
        for (let i = 0; i < this.totalCells; i++) {
            path.push(this.indexToPoint(i));
        }
        return path;
    }
}

// ========================================
// 莫顿码(Z-order)算法
// ========================================
class MortonCode {
    constructor(order) {
        this.order = order;
        this.n = Math.pow(2, order);
        this.totalCells = this.n * this.n;
    }

    // 位交织 - 将x和y坐标交织成莫顿码
    interleave(x, y) {
        let z = 0;
        for (let i = 0; i < this.order; i++) {
            z |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1));
        }
        return z;
    }

    // 位分离 - 将莫顿码分离成x和y坐标
    deinterleave(z) {
        let x = 0, y = 0;
        for (let i = 0; i < this.order; i++) {
            x |= ((z & (1 << (2 * i))) >> i);
            y |= ((z & (1 << (2 * i + 1))) >> (i + 1));
        }
        return { x, y };
    }

    // 将一维索引转换为二维坐标
    indexToPoint(index) {
        return this.deinterleave(index);
    }

    // 生成完整路径
    generatePath() {
        const path = [];
        for (let i = 0; i < this.totalCells; i++) {
            path.push(this.indexToPoint(i));
        }
        return path;
    }
}

// ========================================
// 曲线可视化类
// ========================================
class CurveVisualizer {
    constructor(canvasId, curve, color) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.curve = curve;
        this.color = color;
        this.currentStep = 0;
        this.path = curve.generatePath();
        
        // 设置画布大小
        this.setupCanvas();
        
        // 配置选项
        this.showGrid = true;
        this.showNumbers = true;
        this.cellSize = 0;
        this.padding = 40;
        
        this.calculateCellSize();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.width * dpr; // 正方形
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.width + 'px';
        
        this.canvasSize = rect.width;
    }

    calculateCellSize() {
        const availableSize = this.canvasSize - 2 * this.padding;
        this.cellSize = availableSize / this.curve.n;
    }

    // 将网格坐标转换为画布坐标
    gridToCanvas(x, y) {
        return {
            x: this.padding + x * this.cellSize + this.cellSize / 2,
            y: this.padding + y * this.cellSize + this.cellSize / 2
        };
    }

    // 绘制网格
    drawGrid() {
        if (!this.showGrid) return;
        
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let i = 0; i <= this.curve.n; i++) {
            const x = this.padding + i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding);
            this.ctx.lineTo(x, this.padding + this.curve.n * this.cellSize);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let i = 0; i <= this.curve.n; i++) {
            const y = this.padding + i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(this.padding + this.curve.n * this.cellSize, y);
            this.ctx.stroke();
        }
    }

    // 绘制单元格编号
    drawNumbers() {
        if (!this.showNumbers) return;
        
        this.ctx.font = `${Math.max(8, this.cellSize / 4)}px 'JetBrains Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < this.path.length; i++) {
            const point = this.path[i];
            const canvasPoint = this.gridToCanvas(point.x, point.y);
            
            // 根据进度调整透明度
            const alpha = i <= this.currentStep ? 0.6 : 0.2;
            this.ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
            this.ctx.fillText(i.toString(), canvasPoint.x, canvasPoint.y);
        }
    }

    // 绘制曲线路径
    drawPath(animate = false) {
        const endStep = animate ? this.currentStep : this.path.length - 1;
        
        if (endStep < 1) return;
        
        // 绘制主路径
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 创建渐变效果
        this.ctx.beginPath();
        const startPoint = this.gridToCanvas(this.path[0].x, this.path[0].y);
        this.ctx.moveTo(startPoint.x, startPoint.y);
        
        for (let i = 1; i <= endStep; i++) {
            const point = this.gridToCanvas(this.path[i].x, this.path[i].y);
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        
        // 绘制起点
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(startPoint.x, startPoint.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制当前点(如果在动画中)
        if (animate && endStep > 0) {
            const currentPoint = this.gridToCanvas(this.path[endStep].x, this.path[endStep].y);
            
            // 外圈光晕
            this.ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', ', 0.3)');
            this.ctx.beginPath();
            this.ctx.arc(currentPoint.x, currentPoint.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 内圈实心
            this.ctx.fillStyle = this.color;
            this.ctx.beginPath();
            this.ctx.arc(currentPoint.x, currentPoint.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 绘制终点(如果完成)
        if (endStep === this.path.length - 1) {
            const endPoint = this.gridToCanvas(this.path[endStep].x, this.path[endStep].y);
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 清空画布
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 完整绘制
    draw(animate = false) {
        this.clear();
        this.drawGrid();
        this.drawPath(animate);
        this.drawNumbers();
    }

    // 重置
    reset() {
        this.currentStep = 0;
        this.draw(false);
    }

    // 更新到下一步
    step() {
        if (this.currentStep < this.path.length - 1) {
            this.currentStep++;
            return true;
        }
        return false;
    }

    // 获取当前进度百分比
    getProgress() {
        return Math.round((this.currentStep / (this.path.length - 1)) * 100);
    }

    // 获取当前坐标
    getCurrentCoord() {
        if (this.currentStep < this.path.length) {
            const point = this.path[this.currentStep];
            return `(${point.x}, ${point.y})`;
        }
        return '(0, 0)';
    }
}

// ========================================
// 应用控制器
// ========================================
class App {
    constructor() {
        this.order = 3;
        this.animationSpeed = 1.0;
        this.isPlaying = false;
        this.animationId = null;
        this.showAnimation = true;
        
        this.init();
    }

    init() {
        this.setupCurves();
        this.setupEventListeners();
        this.updateUI();
        this.draw();
    }

    setupCurves() {
        const hilbertCurve = new HilbertCurve(this.order);
        const mortonCurve = new MortonCode(this.order);
        
        this.hilbertViz = new CurveVisualizer('hilbert-canvas', hilbertCurve, 'rgb(129, 140, 248)');
        this.mortonViz = new CurveVisualizer('morton-canvas', mortonCurve, 'rgb(236, 72, 153)');
    }

    setupEventListeners() {
        // 阶数滑块
        document.getElementById('order-slider').addEventListener('input', (e) => {
            this.order = parseInt(e.target.value);
            this.reset();
            this.setupCurves();
            this.updateUI();
            this.draw();
        });

        // 速度滑块
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            document.getElementById('speed-display').textContent = `${this.animationSpeed.toFixed(1)}x`;
        });

        // 播放按钮
        document.getElementById('play-btn').addEventListener('click', () => {
            this.play();
        });

        // 暂停按钮
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pause();
        });

        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });

        // 显示网格复选框
        document.getElementById('show-grid').addEventListener('change', (e) => {
            this.hilbertViz.showGrid = e.target.checked;
            this.mortonViz.showGrid = e.target.checked;
            this.draw();
        });

        // 显示编号复选框
        document.getElementById('show-numbers').addEventListener('change', (e) => {
            this.hilbertViz.showNumbers = e.target.checked;
            this.mortonViz.showNumbers = e.target.checked;
            this.draw();
        });

        // 动画模式复选框
        document.getElementById('show-animation').addEventListener('change', (e) => {
            this.showAnimation = e.target.checked;
            this.draw();
        });

        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        this.hilbertViz.setupCanvas();
        this.hilbertViz.calculateCellSize();
        this.mortonViz.setupCanvas();
        this.mortonViz.calculateCellSize();
        this.draw();
    }

    updateUI() {
        const totalCells = Math.pow(2, this.order * 2);
        
        document.getElementById('order-display').textContent = this.order;
        document.getElementById('hilbert-cells').textContent = totalCells;
        document.getElementById('morton-cells').textContent = totalCells;
        
        this.updateProgress();
    }

    updateProgress() {
        // 更新希尔伯特曲线信息
        document.getElementById('hilbert-progress').textContent = 
            `${this.hilbertViz.getProgress()}%`;
        document.getElementById('hilbert-current').textContent = 
            this.hilbertViz.currentStep;
        document.getElementById('hilbert-coord').textContent = 
            this.hilbertViz.getCurrentCoord();

        // 更新莫顿码信息
        document.getElementById('morton-progress').textContent = 
            `${this.mortonViz.getProgress()}%`;
        document.getElementById('morton-current').textContent = 
            this.mortonViz.currentStep;
        document.getElementById('morton-coord').textContent = 
            this.mortonViz.getCurrentCoord();
    }

    draw() {
        this.hilbertViz.draw(this.showAnimation);
        this.mortonViz.draw(this.showAnimation);
        this.updateProgress();
    }

    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.animate();
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    reset() {
        this.pause();
        this.hilbertViz.reset();
        this.mortonViz.reset();
        this.updateProgress();
    }

    animate() {
        if (!this.isPlaying) return;

        const baseDelay = 50; // 基础延迟(毫秒)
        const delay = baseDelay / this.animationSpeed;

        setTimeout(() => {
            const hilbertContinue = this.hilbertViz.step();
            const mortonContinue = this.mortonViz.step();

            this.draw();

            if (hilbertContinue || mortonContinue) {
                this.animationId = requestAnimationFrame(() => this.animate());
            } else {
                this.pause();
            }
        }, delay);
    }
}

// ========================================
// 初始化应用
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // 添加一些视觉反馈
    console.log('%c🎨 空间填充曲线可视化工具已加载', 'color: #6366f1; font-size: 16px; font-weight: bold;');
    console.log('%c希尔伯特曲线和莫顿码对比工具', 'color: #94a3b8; font-size: 12px;');
});
