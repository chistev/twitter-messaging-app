document.getElementById('gear-icon').addEventListener('click', function() {
    // Change the URL without reloading the page
    history.pushState(null, '', '/messages/settings');
    
    // Replace the column content
    const newContent = `
        <div class="p-3">
            <div class="d-flex">
                <div>
                    <i class="bi bi-arrow-left fs-4" id="back-icon" style="cursor: pointer;"></i>
                </div>
                <div>
                    <h3 class="mb-5 ms-5" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-size: 31px; line-height: 36px; color: #e7e9ea;">Direct Messages</h3>
                </div>
            </div>
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 400; font-size: 15px; line-height: 20px; color: #e7e9ea;">Show read receipts</div>
                </div>
                <div>
                    <input type="checkbox" name="read-receipts" value="read-receipts">
                </div>
            </div>
            <div>Let people you’re messaging with know when you’ve seen their messages.</div>
        </div>
    `;
    const contentColumn = document.getElementById('content-column');
    contentColumn.innerHTML = newContent;
    contentColumn.classList.remove('d-flex', 'flex-column', 'align-items-center', 'justify-content-center');

    // Add event listener to back icon
    document.getElementById('back-icon').addEventListener('click', function() {
        history.pushState(null, '', '/messages');
        location.reload();
    });
});

// Handle browser back/forward button
window.addEventListener('popstate', function(event) {
    if (location.pathname === '/messages/settings') {
        document.getElementById('gear-icon').click();
    } else {
        location.reload();
    }
});

// Initial load based on URL
if (location.pathname === '/messages/settings') {
    document.getElementById('gear-icon').click();
}