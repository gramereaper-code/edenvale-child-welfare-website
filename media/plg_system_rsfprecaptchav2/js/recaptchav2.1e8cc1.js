var RSFormProReCAPTCHAv2 = {
	forms: {},
	loaders: [],
	onLoad: function() {
		window.setTimeout(function(){
			for (var i = 0; i < RSFormProReCAPTCHAv2.loaders.length; i++) {
				var func = RSFormProReCAPTCHAv2.loaders[i];
				if (typeof func === 'function') {
					try {
						func();
					} catch (err) {
						if (console && typeof console.log === 'function') {
							console.log(err);
						}
					}
				}
			}
		}, 500);
	}
};

RSFormProUtils.addEvent(window, 'load', RSFormProReCAPTCHAv2.onLoad);

function ajaxValidationRecaptchaV2(task, formId, data, componentId)
{
	switch (task)
	{
		case 'beforeSend':
			if (data.params.indexOf('g-recaptcha-response=&') > -1 && data.params.indexOf('&page=') === -1)
			{
				RSFormPro.Ajax.Wait = true;
				
				window['RSFormProInvisibleCallback' + formId] = function(token)
				{
					RSFormPro.Ajax.Params = RSFormPro.Ajax.Params.replace('g-recaptcha-response=&', 'g-recaptcha-response=' + encodeURIComponent(token) + '&');
					RSFormPro.Ajax.Wait = false;
					RSFormPro.Ajax.xmlHttp.send(RSFormPro.Ajax.Params);
				};

				var foundRecaptchaEvent = false;
				for (var i = 0; i < RSFormPro.formEvents[formId].length; i++)
				{
					if (typeof RSFormPro.formEvents[formId][i] === 'function' && RSFormPro.formEvents[formId][i].toString().indexOf('grecaptcha.execute(id)') > -1)
					{
						foundRecaptchaEvent = true;
					}
				}

				if (!foundRecaptchaEvent)
				{
					RSFormPro.addFormEvent(formId, function() { var id = RSFormProReCAPTCHAv2.forms[formId]; grecaptcha.execute(id); } )
				}

				RSFormPro.submitForm(RSFormPro.getForm(formId));
			}
			else
			{
				RSFormPro.Ajax.Wait = false;
			}
		break;
	}
}