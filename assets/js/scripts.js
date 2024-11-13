document.addEventListener("DOMContentLoaded", function () {
    // Event listener for the filter button
    document.getElementById("filterButton").addEventListener("click", function () {
        const ingredientsInput = document.getElementById("filterInput").value.toLowerCase().trim();
        
        // Check if input is empty; if so, clear the results and stop further processing
        if (ingredientsInput === "") {
            const container = document.getElementById("resultsContainer");
            container.innerHTML = "<h1>Please enter ingredients to search for recipes.</h1>";
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
    });
});

// Function to display filtered recipes, including missing ingredients and image
function displayResults(data, ingredients) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<h1>No recipes found with these ingredients.</h1>";
        return;
    }

    data.forEach(item => {
        const recipe = item.recipe;
        const matchPercentage = item.matchPercentage;
        const missingIngredients = item.missingIngredients;

        const article = document.createElement("article");
        article.classList.add("box", "post");

        // Highlight matched ingredients and show missing ones
        const highlightedIngredients = recipe.ingredients.map(ingredient => {
            let highlightedIngredient = ingredient;
            ingredients.forEach(ing => {
                if (highlightedIngredient.toLowerCase().includes(ing)) {
                    const regex = new RegExp(`(${ing})`, "gi");
                    highlightedIngredient = highlightedIngredient.replace(regex, `<span class="highlight">$1</span>`);
                }
            });
            return `<li>${highlightedIngredient}</li>`;
        }).join("");

        // Show missing ingredients with an "X"
        const missingList = ingredients.filter(ing => !recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(ing)))
            .map(ingredient => `<span class="missing">X ${ingredient}</span>`).join(", ");

        // Format preparation steps with line breaks for readability
        const formattedPreparation = recipe.preparation
            .replace(/\./g, ".<br>")
            .replace(/<br><br>/g, "<br>");

        // Insert the image directly after the header
        const imageTag = recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image mobile-view-image">` : "";

        article.innerHTML = `
            <header><h2><b>${recipe.name}</b></h2></header><br>
            ${imageTag}
            <p><strong>Ingredients:</strong></p>
            <ul>${highlightedIngredients}</ul>
            <p><strong>Not needed:</strong> ${missingList}</p>
            <p><strong>Match Percentage:</strong> ${matchPercentage.toFixed(2)}%</p>
            <p><strong>Preparation:</strong><br>${formattedPreparation}</p>
        `;
        container.appendChild(article);
    });
}
