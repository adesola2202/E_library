$(document).ready(function() {
    // Handle click on E-Library Management link
    $('#eLibraryLink').click(function(event) {
      event.preventDefault(); // Prevent default link behavior
      $('.main-panel').html('<h3>Loading E-Library Management...</h3>'); // Show loading message
  
      // Make an AJAX request to fetch the E-Library Management content
      $.ajax({
        url: '/admin/books', 
        method: 'GET',
        success: function(data) {
          $('.main-panel').html(data); // Load the response data into the main content area
        },
        error: function() {
          $('.main-panel').html('<p>Error loading E-Library Management. Please try again later.</p>');
        }
      });
    });
  });