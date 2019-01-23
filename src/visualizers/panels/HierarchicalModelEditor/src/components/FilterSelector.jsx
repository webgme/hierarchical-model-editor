/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * @author pmeijer / https://github.com/pmeijer
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import CallSplitIcon from '@material-ui/icons/CallSplit';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import RemoveIcon from '@material-ui/icons/Remove';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

export default class FilterSelector extends Component {
    static propTypes = {
        validItems: PropTypes.object.isRequired,
        activeItems: PropTypes.object.isRequired,
        handleToggle: PropTypes.func.isRequired,
        open: PropTypes.bool,
        onClose: PropTypes.func.isRequired,
    };

    static defaultProps = {
        open: true,
    }

    render() {
        const {validItems, activeItems} = this.props;
        const lists = [];

        Object.keys(validItems).forEach((groupName) => {
            const items = [];
            validItems[groupName].forEach((item) => {
                if (item.hidden) {
                    return;
                }

                const itemId = `${groupName}$${item.name}`;
                let icon;

                switch (groupName) {
                    case 'pointers':
                        icon = <TrendingFlatIcon style={{color: 'rgb(85, 123, 139)'}}/>;
                        break;
                    case 'sets':
                        icon = (item.name === 'network-nodes') ?
                            <MoreHorizIcon/> :
                            <CallSplitIcon className="rotate-90"/>;
                        break;
                    case 'nodes':
                        icon = item.isConnection ? <RemoveIcon/> : <FiberManualRecordIcon/>;
                        break;
                    default:
                        icon = <FiberManualRecordIcon/>;
                        break;
                }

                items.push((
                    <ListItem key={itemId}>
                        <ListItemIcon>
                            {icon}
                        </ListItemIcon>
                        <ListItemText primary={item.name} style={{marginRight: 24}}/>
                        <ListItemSecondaryAction>
                            <Switch
                                onChange={() => {
                                    this.props.handleToggle(itemId);
                                }}
                                checked={activeItems[itemId]}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>));
            });

            if (items.length > 0) {
                lists.push((
                    <div key={groupName} >
                        <Typography variant="subheading">
                            {groupName.toUpperCase()}
                        </Typography>
                        <List>
                            {items}
                        </List>
                        <Divider/>
                    </div>
                ));
            }
        });

        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle id="filter-dialog-title">Apply Filters</DialogTitle>
                <DialogContent>
                    {lists}
                </DialogContent>
            </Dialog>
        );
    }
}
