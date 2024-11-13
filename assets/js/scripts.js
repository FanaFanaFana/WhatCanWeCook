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

        // Include the image if it exists
        const imageTag = recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">` : "";

        article.innerHTML = `
            <header><h2>${recipe.name}</h2></header>
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
