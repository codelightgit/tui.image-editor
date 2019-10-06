/**
 * @author NHN Ent. FE Development Team <dl_javascript@nhn.com>
 * @fileoverview LineDrawingMode class
 */
import DrawingMode from '../interface/drawingMode';
import consts from '../consts';

const {drawingModes} = consts;
const components = consts.componentNames;

/**
 * LineDrawingMode class
 * @class
 * @ignore
 */
class PolygonDrawingMode extends DrawingMode {
    constructor() {
        super(drawingModes.POLYGON_DRAWING);
    }

    /**
    * start this drawing mode
    * @param {Graphics} graphics - Graphics instance
    * @param {{width: ?number, color: ?string}} [options] - Brush width & color
    * @override
    */
    start(graphics, options) {
        const polygonDrawing = graphics.getComponent(components.POLYGON);
        polygonDrawing.start(options);
    }

    /**
     * stop this drawing mode
     * @param {Graphics} graphics - Graphics instance
     * @override
     */
    end(graphics) {
        const polygonDrawing = graphics.getComponent(components.POLYGON);
        polygonDrawing.end();
    }
}

module.exports = PolygonDrawingMode;
