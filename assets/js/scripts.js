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
                const processedData = data.rezepte.map(recipe => {
                    const missingIngredients = [];
                    const totalIngredients = recipe.ingredients.length;

                    const matchCount = ingredients.filter(ingredient => {
                        const isMatch = recipe.ingredients.some(ing => ing.toLowerCase().includes(ingredient));
                        if (!isMatch) missingIngredients.push(ingredient);
                        return isMatch;
                    }).length;

                    const matchPercentage = (matchCount / totalIngredients) * 100;
                    return { recipe, matchPercentage, missingIngredients, totalIngredients };
                });

                const filteredData = processedData.filter(item => item.matchPercentage > 0);

                // Sort recipes
                filteredData.sort((a, b) => {
                    if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
                    return a.totalIngredients - b.totalIngredients;
                });

                displayResults(filteredData, ingredients);
            })
            .catch(error => console.error("Error loading JSON:", error));
    });
});

function displayResults(data, ingredients) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<h1>No recipes found with these ingredients.</h1>";
        return;
    }

    data.forEach((item, index) => {
        const recipe = item.recipe;
        const matchPercentage = item.matchPercentage;
        const missingIngredients = item.missingIngredients;

        const article = document.createElement("article");
        article.classList.add("box", "post");

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

        const missingList = ingredients
            .filter(ing => !recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(ing)))
            .map(ingredient => `<span class="missing">X ${ingredient}</span>`).join(", ");

        const preparationId = `preparation-${index}`;
        const preparationText = recipe.preparation.replace(/\./g, ".<br>").replace(/<br><br>/g, "<br>");

        const preparationContainer = `
            <div id="${preparationId}" class="preparation-container" style="display: none;">
                ${preparationText}
            </div>
            <button class="show-preparation-btn" data-preparation-id="${preparationId}">Show Preparation</button>
        `;

        const imageTag = recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image mobile-view-image">` : "";

        article.innerHTML = `
            <header><h2><b>${recipe.name}</b></h2></header><br>
            ${imageTag}
            <p><strong>Ingredients:</strong></p>
            <ul>${highlightedIngredients}</ul>
            <p><strong>Not needed:</strong> ${missingList}</p>
            <p><strong>Matching:</strong> ${matchPercentage.toFixed(2)}%</p>
            ${preparationContainer}
        `;

        container.appendChild(article);

        // Show preparation text by default on larger screens
        if (window.innerWidth > 900) {
            document.getElementById(preparationId).style.display = "block";
        }
    });

    // Add event listener for all Show Preparation buttons
    container.addEventListener("click", function(event) {
        if (event.target.classList.contains("show-preparation-btn")) {
            const preparationId = event.target.getAttribute("data-preparation-id");
            togglePreparation(preparationId);
        }
    });
}

function togglePreparation(preparationId) {
    const preparationDiv = document.getElementById(preparationId);
    const isHidden = preparationDiv.style.display === "none";

    document.querySelectorAll('.preparation-container').forEach(div => {
        div.style.display = "none";
    });

    preparationDiv.style.display = isHidden ? "block" : "none";
}
