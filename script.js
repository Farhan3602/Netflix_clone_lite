// Alert for email subscription
document.querySelector('.email-form').addEventListener('submit', function(e){
    e.preventDefault();
    alert("Subscription feature coming soon!");
});

// FAQ accordion effect
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', function() {
        const parent = btn.parentElement;
        parent.classList.toggle('active');
        // Optionally collapse others
        document.querySelectorAll('.faq-item').forEach(item => {
            if(item !== parent) item.classList.remove('active');
        });
    });
});
