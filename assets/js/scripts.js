document.addEventListener("DOMContentLoaded", function () {
    // Event listener for the filter button
    document.getElementById("filterButton").addEventListener("click", function () {
        const ingredientsInput = document.getElementById("filterInput").value.toLowerCase();
        
        // Split by commas or spaces (using regex to match both)
        const ingredients = ingredientsInput.split(/[\s,]+/).map(ing => ing.trim()).filter(ing => ing);

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
                    // Primary sort by matchPercentage (highest first)
                    if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
                    // Secondary sort by the number of ingredients (to prioritize recipes with fewer ingredients if matchPercentage is the same)
                    return a.totalIngredients - b.totalIngredients;
                });

                // Pass the processed data for display
                displayResults(filteredData, ingredients);
            })
            .catch(error => console.error("Error loading JSON:", error));
    });
});