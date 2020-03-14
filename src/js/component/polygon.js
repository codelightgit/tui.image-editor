/**
 * @author NHN Ent. FE Development Team <dl_javascript@nhn.com>
 * @fileoverview Free drawing module, Set brush
 */
import fabric from 'fabric';
import Component from '../interface/component';
import consts from '../consts';
const {eventNames} = consts;
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Line
 * @class Line
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class Polygon extends Component {
    constructor(graphics) {
        super(consts.componentNames.POLYGON, graphics);
        /**
         * Brush width
         * @type {number}
         * @private
         */
        this.idCounter = 0;
        this._width = 12;
        this.pointArray = [];
        this.lineArray = [];
        this.activeLine = null;
        this.activeShape = null;
        this.x = 0;
        this.y = 0;
        this.roof = null;
        this.roofPoints = [];
        this.lines = [];
        this.lineCounter = 0;
        this.drawingObject = {
            type: '',
            background: '',
            border: ''
        };

        /**
         * fabric.Color instance for brush color
         * @type {fabric.Color}
         * @private
         */
        this._oColor = new fabric.Color('rgba(0, 0, 0, 0.5)');

        /**
         * Listeners
         * @type {object.<string, function>}
         * @private
         */
        this._listeners = {
            mousedown: this._onFabricMouseDown.bind(this),
            mousemove: this._onFabricMouseMove.bind(this),
            mouseup: this._onFabricMouseUp.bind(this),
            doubleClick: this._onFabricDoubleClick.bind(this)
        };
    }

    /**
     * Start drawing line mode
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    start(setting) {
        const canvas = this.getCanvas();
        this.drawingObject.type = 'roof';
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;

        this.setBrush(setting);

        canvas.forEachObject(obj => {
            obj.set({
                evented: false
            });
        });

        canvas.on({
            'mouse:down': this._listeners.mousedown,
            'mouse:move': this._listeners.mousemove
        });

        fabric.util.addListener(window, 'dblclick', this._listeners.doubleClick);
    }

    /**
     * Set brush
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    setBrush(setting) {
        const brush = this.getCanvas().freeDrawingBrush;
        setting = setting || {};
        this._width = setting.width || this._width;

        if (setting.color) {
            this._oColor = new fabric.Color(setting.color);
        }
        brush.width = this._width;
        brush.color = this._oColor.toRgba();
    }

    setColor(color, obj) {
        this._oColor = fabric.Color.fromHex(color);
        this._oColor.setAlpha(0.5);
        const hexColor = `#${this._oColor.toHexa()}`;
        if (obj) {
            obj.set({fill: hexColor});
            this.getCanvas().renderAll();
        }
    }

    getColor(obj) {
        return obj.fill;
    }

    /**
     * End drawing line mode
     */
    end() {
        const canvas = this.getCanvas();

        canvas.defaultCursor = 'default';
        canvas.selection = true;

        canvas.forEachObject(obj => {
            obj.set({
                evented: true
            });
        });

        canvas.off('mouse:down', this._listeners.mousedown);
        canvas.off('mouse:move', this._listeners.mousemove);
    }

    /**
     * Mousedown event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} options - Fabric event object
     * @private
     */
    _onFabricMouseDown(options) {
        const canvas = this.getCanvas();

        if (this.drawingObject.type === 'roof') {
            canvas.selection = false;
            this._setStartingPoint(options); // set x,y
            this.roofPoints.push(new Point(this.x, this.y));
            const points = [this.x, this.y, this.x, this.y];
            this.lines.push(new fabric.Line(points, {
                strokeWidth: 3,
                selectable: false,
                stroke: 'red'
            }));
            // .setOriginX(this.x)
            // .setOriginY(this.y));
            canvas.add(this.lines[this.lineCounter]);
            this.lineCounter = this.lineCounter + 1;
            // canvas.on('mouse:up', opts => {
            //     opts.selection = true;
            // });
        }
    }

    /**
     * Mousemove event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} options - Fabric event object
     * @private
     */
    _onFabricMouseMove(options) {
        const canvas = this.getCanvas();
        // const pointer = canvas.getPointer(fEvent.e);

        // this._line.set({
        //     x2: pointer.x,
        //     y2: pointer.y
        // });

        // this._line.setCoords();

        // canvas.renderAll();
        if (this.lines.length > 0 && this.lines[0] !== null && this.lines[0] !== 'undefined' && this.drawingObject.type === 'roof') {
            this._setStartingPoint(options);
            this.lines[this.lineCounter - 1].set({
                x2: this.x,
                y2: this.y
            });
            canvas.renderAll();
        }
    }

    /**
     * Mouseup event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
     * @private
     */
    _onFabricMouseUp() {
        const canvas = this.getCanvas();
        const params = this.graphics.createObjectProperties(this._line);

        this.fire(eventNames.ADD_OBJECT, params);

        this._line = null;

        canvas.off({
            'mouse:move': this._listeners.mousemove,
            'mouse:up': this._listeners.mouseup
        });
    }

    _onFabricDoubleClick() {
        const canvas = this.getCanvas();
        this.drawingObject.type = '';
        this.lines.forEach(value => {
            canvas.remove(value);
        });
        // canvas.remove(lines[lineCounter - 1]);
        this.roof = this._makeRoof(this.roofPoints);
        // this.roof.set(consts.fObjectOptions.SELECTION_STYLE);

        canvas.add(this.roof);
        canvas.renderAll();
        // clear arrays
        this.roofPoints = [];
        this.lines = [];
        this.lineCounter = 0;
        this.graphics.stopDrawingMode();
    }

    _setStartingPoint(options) {
        const {x, y} = options.absolutePointer;
        // const canvas = this.getCanvas();
        // const offset = canvas.offset();

        this.x = x;
        this.y = y;
    }

    _makeRoof(roofPoints) {
        const left = this._findLeftPaddingForRoof(roofPoints);
        const top = this._findTopPaddingForRoof(roofPoints);
        roofPoints.push(new Point(roofPoints[0].x, roofPoints[0].y));
        const roof = new fabric.Polygon(roofPoints, {
            stroke: '#58c',
            strokeWidth: 1,
            fill: this._oColor.toRgba(),
            opacity: 1,
            hasControls: true
        });
        roof.set({
            left,
            top
        });

        return roof;
    }

    _findTopPaddingForRoof(roofPoints) {
        let result = 999999;
        let f;
        for (f = 0; f < this.lineCounter; f = f + 1) {
            if (roofPoints[f].y < result) {
                result = roofPoints[f].y;
            }
        }

        return Math.abs(result);
    }

    _findLeftPaddingForRoof(roofPoints) {
        let result = 999999;
        let i;
        for (i = 0; i < this.lineCounter; i = i + 1) {
            if (roofPoints[i].x < result) {
                result = roofPoints[i].x;
            }
        }

        return Math.abs(result);
    }

    _addPoint(opt) {
        this.canvas = this.getCanvas();
        // const id = this.idCounter += 1;
        const {e, absolutePointer} = opt;
        const {x, y} = absolutePointer;
        // const ellipse = new fabric.Ellipse({
        //     id,
        //     radius: 10,
        //     fill: '#ffffff',
        //     stroke: '#00000',
        //     strokeWidth: 0.5,
        //     left: x,
        //     top: y,
        //     selectable: false,
        //     hasBorders: false,
        //     hasControls: false,
        //     originX: 'center',
        //     originY: 'center',
        //     hoverCursor: 'pointer'
        // });
        // if (!this.pointArray.length) {
        //     ellipse.set({
        //         fill: 'red'
        //     });
        // }
        const points = [x, y, x, y];
        const line = new fabric.Line(points, {
            strokeWidth: 2,
            fill: '#999999',
            stroke: '#999999',
            class: 'line',
            originX: 'center',
            originY: 'center',
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false
        });
        if (this.activeShape) {
            const position = this.canvas.getPointer(e);
            const activeShapePoints = this.activeShape.get('points');
            activeShapePoints.push({
                x: position.x,
                y: position.y
            });
            this.polygon = new fabric.Polygon(activeShapePoints, {
                stroke: '#333333',
                strokeWidth: 1,
                fill: this._oColor.toRgba(),
                opacity: 1,
                selectable: false,
                hasBorders: false,
                hasControls: false,
                evented: false
            });
            this.canvas.remove(this.activeShape);
            this.canvas.add(this.polygon);
            this.activeShape = this.polygon;
            this.canvas.renderAll();
        } else {
            const polyPoint = [{
                x,
                y
            }];
            this.polygon = new fabric.Polygon(polyPoint, {
                stroke: '#333333',
                strokeWidth: 1,
                fill: this._oColor.toRgba(),
                opacity: 1,
                selectable: false,
                hasBorders: false,
                hasControls: false,
                evented: false
            });
            this.activeShape = this.polygon;
            this.canvas.add(this.polygon);
        }
        this.activeLine = line;
        // this.pointArray.push(ellipse);
        this.lineArray.push(line);
        this.canvas.add(line);
        // this.canvas.add(ellipse);
    }

    _generate(pointArray) {
        const points = [];
        // const id = this.idCounter += 1;
        pointArray.forEach(point => {
            points.push({
                x: point.left,
                y: point.top
            });
            this.canvas.remove(point);
        });
        this.lineArray.forEach(line => {
            this.canvas.remove(line);
        });
        this.canvas.remove(this.activeShape).remove(this.activeLine);
        // const option = {
        //     id,
        //     points,
        //     type: 'polygon',
        //     stroke: 'rgba(0, 0, 0, 1)',
        //     strokeWidth: 3,
        //     fill: 'rgba(0, 0, 0, 0.25)',
        //     opacity: 1,
        //     objectCaching: true,
        //     name: 'New polygon',
        //     superType: 'drawing'
        // };
        // this.handlers.add(option, false);

        const params = this.graphics.createObjectProperties(this.polygon);

        this.fire(eventNames.ADD_OBJECT, params);
        this.pointArray = [];
        // this.activeLine = null;
        // this.activeShape = null;
    }
}

module.exports = Polygon;
