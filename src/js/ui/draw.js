import util from '../util';
import Colorpicker from './tools/colorpicker';
import Range from './tools/range';
import Submenu from './submenuBase';
import templateHtml from './template/submenu/draw';
import {defaultDrawRangeValus} from '../consts';
const DRAW_OPACITY = 0.7;

/**
 * Draw ui class
 * @class
 * @ignore
 */
class Draw extends Submenu {
    constructor(subMenuElement, {locale, iconStyle, menuBarPosition, usageStatistics}) {
        super(subMenuElement, {
            locale,
            name: 'draw',
            iconStyle,
            menuBarPosition,
            templateHtml,
            usageStatistics
        });

        this._els = {
            lineSelectButton: this.selector('#tie-draw-line-select-button'),
            drawColorpicker: new Colorpicker(
                this.selector('#tie-draw-color'), '#FF4040', this.toggleDirection, this.usageStatistics
            ),
            drawRange: new Range(this.selector('#tie-draw-range'), defaultDrawRangeValus),
            drawRangeValue: this.selector('#tie-draw-range-value')
        };

        this.type = null;
        this.color = this._els.drawColorpicker.color;
        this.width = this._els.drawRange.value;
    }

    /**
     * Add event for draw
     * @param {Object} actions - actions for crop
     *   @param {Function} actions.setDrawMode - set draw mode
     */
    addEvent(actions) {
        this.actions = actions;

        this._els.lineSelectButton.addEventListener('click', this._changeDrawType.bind(this));
        this._els.drawColorpicker.on('change', this._changeDrawColor.bind(this));
        this._els.drawRange.on('change', this._changeDrawRange.bind(this));
        this._els.drawRangeValue.value = this._els.drawRange.value;
        this._els.drawRangeValue.setAttribute('readonly', true);
    }

    /**
     * set draw mode - action runner
     */
    setDrawMode() {
        this.actions.setDrawMode(this.type, {
            width: this.width,
            color: util.getRgb(this.color, DRAW_OPACITY)
        });
    }

    /**
     * Returns the menu to its default state.
     */
    changeStandbyMode() {
        this.type = null;
        this.actions.stopDrawingMode();
        this.actions.changeSelectableAll(true);
        this._els.lineSelectButton.classList.remove('free');
        this._els.lineSelectButton.classList.remove('line');
        this._els.lineSelectButton.classList.remove('polygon');
    }

    /**
     * Executed when the menu starts.
     */
    changeStartMode() {
        this.type = 'free';
        this._els.lineSelectButton.classList.add('free');
        this.setDrawMode();
    }

    /**
     * Change draw type event
     * @param {object} event - line select event
     * @private
     */
    _changeDrawType(event) {
        const button = event.target.closest('.tui-image-editor-button');
        if (button) {
            const lineType = this.getButtonType(button, ['free', 'line', 'polygon']);

            this.actions.discardSelection();

            if (this.type === lineType) {
                this.changeStandbyMode();

                return;
            }

            this.changeStandbyMode();
            this.type = lineType;
            this._els.lineSelectButton.classList.add(lineType);
            this.setDrawMode();
        }
    }

    /**
     * Change drawing color
     * @param {string} color - select drawing color
     * @private
     */
    _changeDrawColor(color) {
        this.color = color || 'transparent';

        if (this.type === 'polygon') {
            this.actions.changeColor(color);

            return;
        }
        if (!this.type) {
            this.changeStartMode();
        } else {
            this.setDrawMode();
        }
    }

    /**
     * Change drawing Range
     * @param {number} value - select drawing range
     * @private
     */
    _changeDrawRange(value) {
        value = util.toInteger(value);
        this._els.drawRangeValue.value = value;
        this.width = value;
        if (!this.type) {
            this.changeStartMode();
        } else {
            this.setDrawMode();
        }
    }
}

export default Draw;
