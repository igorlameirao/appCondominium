/**
 * Layout hug Escalas para listas paginadas (altura/largura pelo conteúdo).
 * Ver `.cursor/rules/lista-card-hug-escalas.mdc`.
 */
export const LIST_CARD_HUG_LAYOUT_STYLES = `
  :host {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    align-self: stretch;
    box-sizing: border-box;
  }
  .list-page {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-width: 0;
    margin: 0;
    box-sizing: border-box;
    overflow: hidden;
    justify-content: flex-start;
  }
  .list-header,
  .list-footer {
    flex-shrink: 0;
  }
  .checkin-table-panel {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .checkin-table-panel .table-scroll-wrapper,
  .table-scroll-wrapper {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }
  .row-click { cursor: pointer; }
`;
