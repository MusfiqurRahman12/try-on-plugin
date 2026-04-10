document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('hybrid-tryon-modal');
    const btn = document.getElementById('open-tryon-modal');
    const closeBtn = document.getElementById('close-tryon-modal');
    const iframe = document.getElementById('hybrid-tryon-iframe');

    if (!btn || !modal) return;

    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Open Modal
        modal.style.display = 'flex';
        
        // Set Iframe src if not set
        if (!iframe.src || iframe.src === window.location.href) {
            iframe.src = hyridTryOnData.app_url;
        }

        // Wait for iframe to load before sending postMessage
        iframe.onload = function() {
            const payload = {
                type: 'TRY_ON_INIT',
                payload: {
                    garmentId: hyridTryOnData.id,
                    garmentUrl: hyridTryOnData.image_url
                }
            };
            
            // Send PostMessage to React App
            iframe.contentWindow.postMessage(payload, hyridTryOnData.app_url);
        };
    });

    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        iframe.src = ''; // reset iframe to save memory
    });

    window.addEventListener('click', function(e) {
        if (e.target == modal) {
            modal.style.display = 'none';
            iframe.src = '';
        }
    });
});
