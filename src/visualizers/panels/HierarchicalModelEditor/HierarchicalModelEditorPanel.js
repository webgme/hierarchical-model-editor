/* globals define, _, WebGMEGlobal */
/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 *
 * Boilerplate code for wrapping reactjs/redux inside webgme (which uses jquery/backbone).
 * @author pmeijer / https://github.com/pmeijer
 */

define([
    'js/Constants',
    'js/PanelBase/PanelBase',
    'js/PanelManager/IActivePanel',
    'common/util/guid',
    'js/DragDrop/DropTarget',
    './HierarchicalModelEditor.bundle',
    'css!./HierarchicalModelEditor.bundle.css',
], function (
    CONSTANTS,
    PanelBase,
    IActivePanel,
    guid,
    DropTarget,
    HierarchicalModelEditorViz,
) {
    'use strict';
    const WebGMEReactPanels = {};

    function HierarchicalModelEditorPanel(layoutManager, params) {
        const options = {};
        // set properties from options
        options[PanelBase.OPTIONS.LOGGER_INSTANCE_NAME] = 'HierarchicalModelEditorPanel';
        options[PanelBase.OPTIONS.FLOATING_TITLE] = true;

        // call parent's constructor
        PanelBase.apply(this, [options, layoutManager]);

        WebGMEGlobal.WebGMEReactPanels = WebGMEReactPanels;

        this.client = params.client;
        this.activeNode = null;

        this.appId = `react-viz-id-${guid()}`;

        // initialize UI
        this.initialize();

        this.logger.debug('ctor finished');
    }

    // inherit from PanelBaseWithHeader
    _.extend(HierarchicalModelEditorPanel.prototype, PanelBase.prototype);
    _.extend(HierarchicalModelEditorPanel.prototype, IActivePanel.prototype);

    HierarchicalModelEditorPanel.prototype.initialize = function initialize() {
        this.$el.prop('id', this.appId);
        this.$el.css({
            width: '100%',
            height: '100%',
        });

        this.activeNode = WebGMEGlobal.State.getActiveObject();

        this.stateMediator = {
            // Called by react component
            setActiveNode: (activeNode) => {
                if (typeof activeNode === 'string' && this.activeNode !== activeNode) {
                    this.activeNode = activeNode;
                    WebGMEGlobal.State.registerActiveObject(activeNode);
                }
            },
            setActiveSelection: (activeSelection) => {
                WebGMEGlobal.State.registerActiveSelection(activeSelection);
            },
            // Overwritten by the react-component
            onActiveNodeChange: (activeNode) => {
                console.warn('onActiveNodeChange not overwritten by react component..', activeNode);
            },
            onActiveSelectionChange: (activeSelection) => {
                console.warn('onActiveSelectionChange not overwritten by react component..', activeSelection);
            },
            // Life-cycle placeholders.
            onActivate: () => {
                console.warn('onActivate not overwritten by react component');
            },
            onDeactivate: () => {
                console.warn('onDeactivate not overwritten by react component');
            },
            onDestroy: () => {
                console.warn('onDestroy not overwritten by react component');
            },
            onReadOnlyChanged: (isReadonly) => {
                console.warn('onReadOnlyChanged not overwritten by react component', isReadonly);
            },
            onResize: (width, height) => {
                console.warn('onResize not overwritten by react component', width, height);
            },
        };

        const initialState = {
            // The UI state, these can be modified by the react app as well.
            activeNode: this.activeNode,
            activeSelection: WebGMEGlobal.State.getActiveSelection(),

            // activeTab: WebGMEGlobal.State.getActiveTab(),
            // activeAspect: WebGMEGlobal.State.getActiveAspect(),

            // Panel state (are passed in by the e.g. split-panel)
            isActivePanel: false,
            readOnly: false,
            // size: {
            //     width: 0,
            //     height: 0,
            // },
        };

        WebGMEReactPanels[this.appId] = {
            client: this.client,
            initialized: false,
            initialState,
            stateMediator: this.stateMediator,
        };
    };

    HierarchicalModelEditorPanel.prototype.afterAppend = function afterAppend() {
        const self = this;
        HierarchicalModelEditorViz(this.appId);
        DropTarget.makeDroppable(this.$el, {
            drop: function drop(event, dragInfo) {
                // console.log(event, dragInfo);
                if (typeof self.activeNode === 'string' &&
                    dragInfo &&
                    dragInfo.DRAG_EFFECTS &&
                    dragInfo.DRAG_EFFECTS[0] === 'DRAG_CREATE_INSTANCE' &&
                    dragInfo.DRAG_ITEMS &&
                    dragInfo.DRAG_ITEMS.length === 1) {
                    try {
                        self.client.createNode({
                            baseId: dragInfo.DRAG_ITEMS[0],
                            parentId: self.activeNode,
                        }, {
                            registry: {
                                position: {
                                    x: event.offsetX,
                                    y: event.offsetY,
                                },
                            },
                        });
                    } catch (e) {
                        self.logger.error(e);
                    }
                }
            },
        });
    };

    HierarchicalModelEditorPanel.prototype.onReadOnlyChanged = function onReadOnlyChanged(isReadOnly) {
        // apply parent's onReadOnlyChanged
        PanelBase.prototype.onReadOnlyChanged.call(this, isReadOnly);
        this.stateMediator.onReadOnlyChanged(isReadOnly);
    };

    HierarchicalModelEditorPanel.prototype.onResize = function onResize(width, height) {
        this.stateMediator.onResize(width, height);
    };

    HierarchicalModelEditorPanel.prototype.stateActiveObjectChanged = function stateActiveObjectChanged(model, activeNode) {
        if (this.activeNode !== activeNode) {
            this.activeNode = activeNode;
            this.stateMediator.onActiveNodeChange(activeNode);
        }
    };

    HierarchicalModelEditorPanel.prototype.stateActiveSelectionChanged = function stateActiveSelectionChanged(model, activeSelection) {
        this.stateMediator.onActiveSelectionChange(activeSelection);
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    HierarchicalModelEditorPanel.prototype.attachClientEventListeners = function attachClientEventListeners() {
        this.detachClientEventListeners();
        WebGMEGlobal.State.on(`change:${CONSTANTS.STATE_ACTIVE_OBJECT}`, this.stateActiveObjectChanged, this);
        WebGMEGlobal.State.on(`change:${CONSTANTS.STATE_ACTIVE_SELECTION}`, this.stateActiveSelectionChanged, this);
    };

    HierarchicalModelEditorPanel.prototype.detachClientEventListeners = function detachClientEventListeners() {
        WebGMEGlobal.State.off(`change:${CONSTANTS.STATE_ACTIVE_OBJECT}`, this.stateActiveObjectChanged);
        WebGMEGlobal.State.off(`change:${CONSTANTS.STATE_ACTIVE_SELECTION}`, this.stateActiveSelectionChanged);
    };

    HierarchicalModelEditorPanel.prototype.destroy = function destroy() {
        this.detachClientEventListeners();
        this.stateMediator.onDestroy();
        delete WebGMEReactPanels[this.appId];
        PanelBase.prototype.destroy.call(this);
    };

    HierarchicalModelEditorPanel.prototype.onActivate = function onActivate() {
        this.attachClientEventListeners();
        this.stateMediator.onActivate();
        if (typeof this.activeNode === 'string') {
            WebGMEGlobal.State.registerActiveObject(
                this.activeNode,
                {suppressVisualizerFromNode: true},
            );
        }
    };

    HierarchicalModelEditorPanel.prototype.onDeactivate = function onDeactivate() {
        this.detachClientEventListeners();
        this.stateMediator.onDeactivate();
    };

    return HierarchicalModelEditorPanel;
});
