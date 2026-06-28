export const FORM_CONFIRM_STYLES = `
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.confirm-modal {
  background: #fff; padding: 24px; border-radius: 12px; max-width: 400px;
  box-shadow: 0 20px 50px rgba(15,23,42,.2);
}
.confirm-modal p { margin: 0 0 16px; }
.confirm-modal button { margin-right: 8px; }
.btn-gravar { background: #0e7490; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-cancelar { background: #e2e8f0; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-excluir { background: #dc3545; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.msg-erro { color: #dc3545; margin-top: 12px; }
.readonly { background: #f1f5f9; }
`;
