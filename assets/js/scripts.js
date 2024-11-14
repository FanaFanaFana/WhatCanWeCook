document.addEventListener("DOMContentLoaded", function () {
    const filterInput = document.getElementById("filterInput");
    const filterButton = document.getElementById("filterButton");

    // Function to handle the search functionality
    function handleSearch() {
        const ingredientsInput = filterInput.value.toLowerCase().trim();

        // Check if input is empty or only contains commas or periods
        if (ingredientsInput === "" || /^[,.]+$/.test(ingredientsInput)) {
            const container = document.getElementById("resultsContainer");
            container.innerHTML = "<h1>Please enter valid ingredients to search for recipes.</h1>";
            return;
        }

        const ingredients = ingredientsInput.split(",").map(ing => ing.trim());

        // AJAX request to load JSON data
        fetch("rezepte.json")
            .then(response => response.json())
            .then(data => {
                // Process each recipe to calculate match percentage and track missing ingredients
                const processedData = data.rezepte.map(recipe => {
                    const missingIngredients = [];
                    const totalIngredients = recipe.ingredients.length;

                    // Calculate match count and track missing ingredients
                    const matchCount = ingredients.filter(ingredient => {
                        const isMatch = recipe.ingredients.some(ing => ing.toLowerCase().includes(ingredient));
                        if (!isMatch) missingIngredients.push(ingredient); // Track missing ingredients
                        return isMatch;
                    }).length;

                    // Calculate the match percentage
                    const matchPercentage = (matchCount / totalIngredients) * 100;

                    return { recipe, matchPercentage, missingIngredients, totalIngredients }; // Include match percentage info
                });

                // Filter out recipes with no matches at all
                const filteredData = processedData.filter(item => item.matchPercentage > 0);

                // Sort recipes by match percentage (highest first) and then by the number of ingredients (lowest first)
                filteredData.sort((a, b) => {
                    if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
                    return a.totalIngredients - b.totalIngredients;
                });

                // Pass the processed data for display
                displayResults(filteredData, ingredients);
            })
            .catch(error => console.error("Error loading JSON:", error));
    }

    // Event listener for the filter button
    filterButton.addEventListener("click", handleSearch);

    // Event listener for Enter key on the input field
    filterInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            handleSearch();
        }
    });
});


// Function to display filtered recipes, including missing ingredients and image
function displayResults(data, ingredients) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<h1>No recipes found with these ingredients. Make sure to use ',' between ingredients !</h1>";
        return;
    }

    const displayedNames = new Set(); // Track displayed recipe names to avoid duplicates

    data.forEach((item, index) => {
        const recipe = item.recipe;
        const matchPercentage = item.matchPercentage;
        const missingIngredients = item.missingIngredients;

        // Skip if this recipe name has already been displayed
        if (displayedNames.has(recipe.name)) return;
        displayedNames.add(recipe.name); // Add to set to mark as displayed

        const article = document.createElement("article");
        article.classList.add("box", "post");

        // Highlight matched ingredients and make each clickable
        const highlightedIngredients = recipe.ingredients.map(ingredient => {
            let highlightedIngredient = ingredient;
            ingredients.forEach(ing => {
                if (highlightedIngredient.toLowerCase().includes(ing)) {
                    const regex = new RegExp(`(${ing})`, "gi");
                    highlightedIngredient = highlightedIngredient.replace(regex, `<span class="highlight">$1</span>`);
                }
            });
            // Make ingredient clickable
            return `<li><span class="clickable-ingredient" onclick="addIngredientToSearch('${ingredient}')">${highlightedIngredient}</span></li>`;
        }).join("");

        // Show missing ingredients with an "X"
        const missingList = ingredients.filter(ing => !recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(ing)))
            .map(ingredient => `<span class="missing">X ${ingredient}</span>`).join(", ");

        // Preparation steps initially hidden in a container
        const preparationId = `preparation-${index}`; // Unique ID for each preparation section
        const preparationContainer = `
            <button onclick="togglePreparation('${preparationId}')">Show Preparation</button>
            <div id="${preparationId}" style="display: none; margin-top: 25px;">
                ${recipe.preparation.replace(/\./g, ".<br>").replace(/<br><br>/g, "<br>")}
            </div>
        `;

        // Insert the image directly after the header
        const imageTag = recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image mobile-view-image">` : "";

        article.innerHTML = `
            <header><h2><b>${recipe.name}</b></h2></header><br>
            ${imageTag} <br>
            <p><strong>Ingredients:</strong></p>
            <ul>${highlightedIngredients}</ul>
            <p><strong>Not needed:</strong> ${missingList}</p>
            <p><strong>Matching:</strong> ${matchPercentage.toFixed(2)}%</p>
            
            ${preparationContainer}
        `;
        container.appendChild(article);
    });
}

// JavaScript function to add an ingredient to the search bar if it's not already there
function addIngredientToSearch(ingredient) {
    const filterInput = document.getElementById("filterInput");
    const currentIngredients = filterInput.value.toLowerCase().split(",").map(ing => ing.trim());

    // Add the ingredient if it's not already in the search bar
    if (!currentIngredients.includes(ingredient.toLowerCase())) {
        currentIngredients.push(ingredient);
        filterInput.value = currentIngredients.join(", ");
    }
}

// JavaScript function to toggle visibility of preparation steps
function togglePreparation(preparationId) {
    const preparationDiv = document.getElementById(preparationId);
    const isHidden = preparationDiv.style.display === "none";
    preparationDiv.style.display = isHidden ? "block" : "none";
}

