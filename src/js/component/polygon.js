/**
 * @author NHN Ent. FE Development Team <dl_javascript@nhn.com>
 * @fileoverview Free drawing module, Set brush
 */
import fabric from 'fabric';
import Component from '../interface/component';
import consts from '../consts';

const {eventNames} = consts;

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
            mouseup: this._onFabricMouseUp.bind(this)
        };
    }

    /**
     * Start drawing line mode
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    start(setting) {
        const canvas = this.getCanvas();

        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;

        this.setBrush(setting);

        canvas.forEachObject(obj => {
            obj.set({
                evented: false
            });
        });

        canvas.on({
            'mouse:down': this._listeners.mousedown
        });
    }

    /**
     * Set brush
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    setBrush(setting) {
        console.log(setting);

        const brush = this.getCanvas().freeDrawingBrush;

        setting = setting || {};
        this._width = setting.width || this._width;

        if (setting.color) {
            this._oColor = new fabric.Color(setting.color);
        }
        brush.width = this._width;
        brush.color = this._oColor.toRgba();
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
    }

    /**
     * Mousedown event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
     * @private
     */
    _onFabricMouseDown(fEvent) {
        const {target} = fEvent;
        // const canvas = this.getCanvas();
        // const pointer = canvas.getPointer(fEvent.e);
        // const points = [pointer.x, pointer.y, pointer.x, pointer.y];

        // this._line = new fabric.Line(points, {
        //     stroke: this._oColor.toRgba(),
        //     strokeWidth: this._width,
        //     evented: false
        // });

        // this._line.set(consts.fObjectOptions.SELECTION_STYLE);

        // canvas.add(this._line);

        // canvas.on({
        //     'mouse:move': this._listeners.mousemove,
        //     'mouse:up': this._listeners.mouseup
        // });
        if (target && this.pointArray.length && target.id === this.pointArray[0].id) {
            this._generate(this.pointArray);
        } else {
            this._addPoint(fEvent);
        }
    }

    /**
     * Mousemove event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
     * @private
     */
    _onFabricMouseMove(fEvent) {
        const canvas = this.getCanvas();
        const pointer = canvas.getPointer(fEvent.e);

        this._line.set({
            x2: pointer.x,
            y2: pointer.y
        });

        this._line.setCoords();

        canvas.renderAll();
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

    _addPoint(opt) {
        this.canvas = this.getCanvas();
        const id = this.idCounter += 1;
        const {e, absolutePointer} = opt;
        const {x, y} = absolutePointer;
        const circle = new fabric.Circle({
            id,
            radius: 10,
            fill: '#ffffff',
            stroke: '#00000',
            strokeWidth: 0.5,
            left: x,
            top: y,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            originX: 'center',
            originY: 'center',
            hoverCursor: 'pointer'
        });
        if (!this.pointArray.length) {
            circle.set({
                fill: 'red'
            });
        }
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
        this.pointArray.push(circle);
        this.lineArray.push(line);
        this.canvas.add(line);
        this.canvas.add(circle);
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
        // this.pointArray = [];
        // this.activeLine = null;
        // this.activeShape = null;
    }
}

module.exports = Polygon;
