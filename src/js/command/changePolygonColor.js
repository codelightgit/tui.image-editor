/**
 * @author NHN Ent. FE Development Team <dl_javascript@nhn.com>
 * @fileoverview Change icon color
 */
import commandFactory from '../factory/command';
import Promise from 'core-js/library/es6/promise';
import consts from '../consts';

const {componentNames, rejectMessages, commandNames} = consts;
const {POLYGON} = componentNames;

const command = {
    name: commandNames.CHANGE_POLYGON_COLOR,

    /**
     * Change icon color
     * @param {Graphics} graphics - Graphics instance
     * @param {number} id - object id
     * @param {string} color - Color for icon
     * @returns {Promise}
     */
    execute(graphics, id, color) {
        return new Promise((resolve, reject) => {
            const iconComp = graphics.getComponent(POLYGON);
            const targetObj = graphics.getObject(id);

            if (!targetObj) {
                reject(rejectMessages.noObject);
            }

            this.undoData.object = targetObj;
            this.undoData.color = iconComp.getColor(targetObj);
            iconComp.setColor(color, targetObj);
            resolve();
        });
    },
    /**
     * @param {Graphics} graphics - Graphics instance
     * @returns {Promise}
     */
    undo(graphics) {
        const comp = graphics.getComponent(POLYGON);
        const {object: icon, color} = this.undoData.object;

        comp.setColor(color, icon);

        return Promise.resolve();
    }
};

commandFactory.register(command);

module.exports = command;
