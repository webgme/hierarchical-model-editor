/* globals define */
/**
 * @author pmeijer / https://github.com/pmeijer
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    }
}(function () {
    const CONSTANTS = {
        CYTOSCAPE_POS_REG_KEY: 'cytoscapePosition',
    };

    return CONSTANTS;
}));
