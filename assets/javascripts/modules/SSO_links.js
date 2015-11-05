require('jquery');

//TODO-benC: this file is doing to much, GET/POST/Links/Redirect - needs to be split out.

/**
 * SSO encryption process file
 * Use Cases:
 * Customer clicks a link
 * Customer is sent to a page which contains a redirect element
 *
 * SSO GET call is successful then let the SSO redirect manage that.
 * SSO GET call is a failure cancel
 * - 401 (Unauthorised) - reload the page (this is currently used for links only)
 * - Anything else, render the returned html error page and place in the page (BadRequest from Encryption process)
 *
 * @param element
 * @param ssoUrl
 * @param ssoMethod
 * @returns {boolean}
 */
module.exports = function(element, ssoUrl, ssoMethod) {
  var $element,
      payload,
      clientSso,
      serverSso,
      destination,
      newWindow,
      winId;
  var elementHref;
  var useGet = ssoMethod === 'GET';

  if (element) {
    $element = $(element);
    newWindow = !!$element.attr('target');
    winId = element.id;
    elementHref = element.href;
    clientSso = $element.data('sso') === true || $element.data('sso') === 'client';
    serverSso = $element.data('sso') === 'server';

    if (clientSso || serverSso) {
      destination = serverSso ? {
        ssoRedirect: true
      } : {
        destinationUrl: elementHref
      };

      $.ajax({
        url: serverSso ? elementHref : '/ssoout',
        data: destination, 
        type: 'GET',
        async: false,
        cache: false,
        success: function(data, status, jqXHR) {
          var win = window,
              getUrl = ssoUrl + '?payload=' + encodeURIComponent(data);

          if (useGet) {
            if (newWindow) {
              win.open(getUrl, !!winId ? winId : '_blank');
              win.focus();
            } else {
              win.location = getUrl;
            }
          } else {
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = ssoUrl;

            if (newWindow) {
              form.target = !!winId ? winId : '_blank';
            }

            payload = document.createElement('input');
            payload.type = 'hidden';
            payload.name = 'payload';
            payload.value = data;
            document.body.appendChild(form);
            form.appendChild(payload);

            // POST form
            form.submit();

            if (newWindow) {
              win.focus();
            }
          }
        },

        error: function(jqXHR, textStatus, errorThrown) {
          var statusCode = jqXHR.status;
          var responseText = jqXHR.responseText;

          if (statusCode === 401) {
            // Unauthorised from a page link click
            window.location.reload();
          } else {
            if (responseText) {
              // place returned failure html into page
              $('html').html(responseText);
            }
          }
        }
      });
    }
  }
};
