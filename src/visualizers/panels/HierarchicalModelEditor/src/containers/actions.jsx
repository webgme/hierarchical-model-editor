/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * @author pmeijer / https://github.com/pmeijer
 */
export const setActiveNode = activeNode => ({
    type: 'SET_ACTIVE_NODE',
    activeNode,
});

export const setActiveSelection = activeSelection => ({
    type: 'SET_ACTIVE_SELECTION',
    activeSelection,
});


export const setReadOnly = readOnly => ({
    type: 'SET_READ_ONLY',
    readOnly,
});

export const setIsActivePanel = isActivePanel => ({
    type: 'SET_IS_ACTIVE_PANEL',
    isActivePanel,
});

export const setPanelSize = panelSize => ({
    type: 'SET_PANEL_SIZE',
    panelSize,
});
