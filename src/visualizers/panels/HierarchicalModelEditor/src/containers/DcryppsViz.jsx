/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * @author pmeijer / https://github.com/pmeijer
 */
import {connect} from 'react-redux';

import {setActiveNode, setActiveSelection} from './actions';
import SubTree from '../gme/SubTree';

const mapStateToProps = state => ({
    activeNode: state.activeNode,
    activeSelection: state.activeSelection,

    readOnly: state.readOnly,
    isActivePanel: state.isActivePanel,
    width: state.panelSize.width,
    height: state.panelSize.height,
});

const mapDispatchToProps = dispatch => ({
    setActiveNode: (activeNode) => {
        dispatch(setActiveNode(activeNode));
    },
    setActiveSelection: (activeSelection) => {
        dispatch(setActiveSelection(activeSelection));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubTree);
