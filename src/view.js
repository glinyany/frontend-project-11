
const renderErrors = (input, feedback, errorType, i18n) => {
  console.log("Rendering ERR:", errorType);
  if (errorType === 'null') {
    input.classList.remove('is-invalid');
    input.value = '';
    feedback.textContent = i18n.t('success');
    feedback.classList.replace('text-danger', 'text-success');
    input.focus();
    return;
  }
  input.classList.add('is-invalid');
  feedback.textContent = i18n.t(`errors.${errorType}`);
  feedback.classList.replace('text-success', 'text-danger');
};

export default (state, path, i18next, { input, submitBtn, feedback }) => {
  // const { input, submitBtn, feedback } = elements;

  const clearInputField = () => {
    input.value = '';
  };

  switch (path) {
    case 'formProcess.status':
      console.log('2: Status:\n', path, state);
      const errorType = state.formProcess.error;
      if (state.formProcess.status === 'failed') {
        renderErrors(input, feedback, errorType, i18next);
      }
      if (state.formProcess.status === 'working') {
        renderErrors(input, feedback, errorType, i18next)
      }
      if (state.formProcess.status === 'success') {
        
      }
      break;
    default:
      break;
  }
}

