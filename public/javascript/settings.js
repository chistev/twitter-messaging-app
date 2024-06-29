document.addEventListener('DOMContentLoaded', function() {
    const modal = new bootstrap.Modal(document.getElementById('messageModal'));
    const body = document.querySelector('body');

    // Function to change background color
    function changeBackgroundColor(color) {
        body.style.backgroundColor = color;
    }

    // Show modal and change background color
    document.querySelector('.bi-envelope-at').addEventListener('click', function() {
        changeBackgroundColor('#242d34'); // Change background color
        modal.show();
    });

    // Hide modal and revert background color
    modal._element.addEventListener('hidden.bs.modal', function() {
        changeBackgroundColor('#000000'); // Revert background color
    });

    // Additional event listeners for buttons that open the modal
    document.querySelectorAll('.btn').forEach(button => {
        if (button.textContent.trim() === 'Write a message' || button.textContent.trim() === 'New message') {
            button.addEventListener('click', function() {
                changeBackgroundColor('#242d34'); // Change background color
                modal.show();
            });
        }
    });
});
