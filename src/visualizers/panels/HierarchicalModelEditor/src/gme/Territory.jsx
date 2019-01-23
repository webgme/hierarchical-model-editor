/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * @author pmeijer / https://github.com/pmeijer
 */

import {Component} from 'react';
import PropTypes from 'prop-types';

export default class Territory extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        onUpdate: PropTypes.func.isRequired,
        territory: PropTypes.object,

        onlyActualEvents: PropTypes.bool,
        reuseTerritory: PropTypes.bool,
    };

    static defaultProps = {
        territory: null,
        onlyActualEvents: true,
        reuseTerritory: true,
    };

    componentDidMount() {
        const {gmeClient, territory} = this.props;

        this.uiId = gmeClient.addUI(null, this.getEventHandler());

        if (territory) {
            gmeClient.updateTerritory(this.uiId, territory);
        }
    }

    componentWillReceiveProps(nextProps) {
        const {gmeClient} = nextProps;
        const {territory, reuseTerritory} = this.props;

        if (JSON.stringify(territory) !== JSON.stringify(nextProps.territory)) {
            if (!reuseTerritory) {
                gmeClient.removeUI(this.uiId);
                this.uiId = gmeClient.addUI(null, this.getEventHandler());
            }

            gmeClient.updateTerritory(this.uiId, nextProps.territory || {});
        }
    }

    componentWillUnmount() {
        const {gmeClient} = this.props;

        gmeClient.removeUI(this.uiId);
    }

    getEventHandler() {
        const {onUpdate, onlyActualEvents, gmeClient} = this.props;

        return (events) => {
            const load = [];
            const update = [];
            const unload = [];
            const hash = gmeClient.getActiveRootHash();

            events.forEach((event) => {
                switch (event.etype) {
                    case 'load':
                        load.push(event.eid);
                        break;
                    case 'update':
                        update.push(event.eid);
                        break;
                    case 'unload':
                        unload.push(event.eid);
                        break;
                    default:
                    // technical event, do not care
                }
            });

            if (!onlyActualEvents || load.length > 0 || update.length > 0 || unload.length > 0) {
                onUpdate(hash, load, update, unload);
            }
        };
    }

    uiId = null;

    render() {
        return null;
    }
}
