/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * This is the main Component for the Visualizer.
 * It contains boilerplate code matching the dcryppsPanel.js and creates the Redux store and additionally
 * creates and configures the pieces that builds up the visualizer.
 * @author pmeijer / https://github.com/pmeijer
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import reducers from './containers/reducers';
import {setActiveNode, setActiveSelection, setIsActivePanel, setReadOnly, setPanelSize} from './containers/actions';
import DcryppsViz from './containers/DcryppsViz';
import GraphEditor from './components/GraphEditor';
import CONSTANTS from '../../../../common/CONSTANTS';

const OPTIONS = {
    // Array of attributes to extract
    // attributeNames: ['name', 'label'],
    // Array of registries to extract
    registryNames: ['position', CONSTANTS.CYTOSCAPE_POS_REG_KEY, 'SVGIcon'],
    // Array of pointer names to extract - default is all defined pointers (nodeObj.getSetNames).
    pointerNames: [],
    // Array of set names to extract as edges - default is all defined sets (nodeObj.getSetNames).
    setNames: [],
    // Mapping from set name to set attribute name - is label: true it will be used as label for those edges.
    setMemberAttributes: {},
    // The depth of the territory, i.e. the number of levels of containment-hierarchy to display.
    depth: 10,
};

const FILTERS = {
    pointers: [
        {
            name: 'pre',
            active: false,
        },
        {
            name: 'post',
            active: false,
        },
    ],
    sets: (() => OPTIONS.setNames.map(setName => ({name: setName, active: false})))(),
    nodes: [],
};

export default class ReactViz extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        stateMediator: PropTypes.object.isRequired,
        initialState: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.store = createStore(reducers, this.props.initialState);

        const {stateMediator} = this.props;

        stateMediator.onActiveNodeChange = (activeNode) => {
            this.store.dispatch(setActiveNode(typeof activeNode === 'string' ? activeNode : null));
        };

        stateMediator.onActiveSelectionChange = (activeSelection) => {
            this.store.dispatch(setActiveSelection(activeSelection instanceof Array ? activeSelection : []));
        };

        stateMediator.onActivate = () => {
            this.store.dispatch(setIsActivePanel(true));
        };

        stateMediator.onDeactivate = () => {
            this.store.dispatch(setIsActivePanel(false));
        };

        stateMediator.onReadOnlyChanged = (readOnly) => {
            this.store.dispatch(setReadOnly(readOnly));
        };

        stateMediator.onResize = (width, height) => {
            this.store.dispatch(setPanelSize({width, height}));
        };

        this.store.subscribe(() => {
            const state = this.store.getState();
            if (state.isActivePanel) {
                stateMediator.setActiveNode(state.activeNode);
                stateMediator.setActiveSelection(state.activeSelection);
            }
        });
    }

    render() {
        const {gmeClient} = this.props;
        let content = <div/>;

        if (gmeClient) {
            content = (
                <DcryppsViz gmeClient={this.props.gmeClient} options={OPTIONS}>
                    <GraphEditor validFilters={FILTERS}/>
                </DcryppsViz>
            );
        }

        return (
            <Provider store={this.store}>
                {content}
            </Provider>
        );
    }
}
