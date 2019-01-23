/* globals document */
/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * @author pmeijer / https://github.com/pmeijer
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export default class ContextMenu extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        data: PropTypes.object.isRequired,
        nodeId: PropTypes.string.isRequired, // FIXME: should be nodeIds
        eventX: PropTypes.number.isRequired,
        eventY: PropTypes.number.isRequired,
        onClose: PropTypes.func.isRequired,
        setActiveNode: PropTypes.func.isRequired,

        readOnly: PropTypes.bool,
    };

    static defaultProps = {
        readOnly: false,
    }

    setActiveNode = () => {
        const {nodeId, onClose, setActiveNode} = this.props;

        setActiveNode(nodeId);
        onClose();
    }

    deleteNode = () => {
        const {gmeClient, nodeId, onClose} = this.props;

        gmeClient.deleteNode(nodeId);

        onClose();
    }

    render() {
        const {
            gmeClient,
            nodeId,
            eventX,
            eventY,
            readOnly,
            data,
        } = this.props;

        // console.log(data);
        const menuItems = [];
        const nodeObj = gmeClient.getNode(nodeId);
        if (false) {
            const metaNodeObj = gmeClient.getNode(nodeObj.getMetaTypeId());

            menuItems.push((
                <MenuItem key="meta-type" onClick={this.props.onClose} disabled={readOnly}>
                    {`<<${metaNodeObj.getAttribute('name')}>>`}
                </MenuItem>));

            if (metaNodeObj.getAttribute('name') === 'System') {
                menuItems.push((
                    <MenuItem key="open-sub-system" onClick={this.setActiveNode} >
                        Open Subsystem ...
                    </MenuItem>));
            }
        } else if (data.memberAttrs && data.memberAttrs.length > 0) {
            let args;
            data.memberAttrs.forEach((memAttr) => {
                if (memAttr.name === 'args') {
                    args = memAttr.value ? `(${memAttr.value})` : '()';
                }
            });

            if (args) {
                menuItems.push((
                    <MenuItem key="invocation-args" onClick={this.props.onClose}>
                        Invocation arguments: {args}
                    </MenuItem>));
            }
        } else if (data.pointerName === 'post' || data.pointerName === 'pre') {
            const methodNode = gmeClient.getNode(data.source);
            const modeNode = gmeClient.getNode(data.target);
            if (methodNode && modeNode) {
                // const parentName = gmeClient.getNode(modeNode.getParentId()).getAttribute('name');
                // const modeName = modeNode.getAttribute('name');
                const methodName = methodNode.getAttribute('name');
                menuItems.push((
                    <MenuItem key="pre-post-condition" onClick={this.props.onClose}>
                        {`${data.pointerName}-condition for ${methodName}`}
                    </MenuItem>));
            }
        } else if (data.setName === 'network-nodes') {
            menuItems.push((
                <MenuItem key="cell-network-nodes" onClick={this.props.onClose}>
                    {`${data.setName}`}
                </MenuItem>));
        }

        if (menuItems.length === 0) {
            this.props.onClose();
            return <div/>;
        }

        return (
            <Menu
                id="simple-menu"
                anchorEl={document.body}
                style={{
                    position: 'absolute',
                    top: eventY - (document.body.clientHeight / 2),
                    left: eventX,
                }}
                open
                onClose={this.props.onClose}
            >
                {menuItems}
            </Menu>
        );
    }
}
