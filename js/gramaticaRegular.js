let entradas = 0;
let alfabeto=["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
let inputs = 1;
function validarGramatica(gramatica) {
    let auxArray = new Map();

    gramatica.forEach(item => {
        if (auxArray.has(item[0])) { 
            auxArray.set(item[0], `(${auxArray.get(item[0])}|${item[1]})`); 
        } else { 
            auxArray.set(item[0], item[1]); 
        }
    });


// ER recebe regras de gramática
    let ER = substituirGramatica(auxArray.get('S'), auxArray);
    while (ER !== substituirGramatica(ER, auxArray)) {
      ER = substituirGramatica(ER, auxArray);
    }

    ER = ER.replace("ε", "");

    
    var regexp = new RegExp(`^(${ER})$`);

    return regexp;
  }


// Função para transformar a gramática regular em expressão regular
function substituirGramatica(valor, gramatica) { 
    let novaString = valor;
    for(const element of valor) {
        if (gramatica.has(element)) {
            novaString = novaString.replace(element, `${gramatica.get(element)}`);
        }
    }

    return novaString;
}

function resetar() {
    const resetbtn = document.querySelector("#reset")       // Faz um reset na página
        window.parent.location = window.parent.location.href;
}

function AdicionarRegra() {     // Função para adicionar nova entrada de regra 
    let prod  = "<div class='ctnFlex'>"
        + "<div class='col-nt'>"
        + `<input type='text' id='key-${entradas}' value ='${alfabeto[entradas]}'class='form-control' />`
        + "</div>"
        + "<div id='arrow'>→</div>"
        + "<div class='col-pr'>"
        + `<input type='text' class='form-control' id='value-${entradas}' placeholder='ε' />`
        + "</div>"
        + "</div>"

    entradas++;
    $('.container').append(prod)
}


// Função principal que valida a entrada que o usuário digitar
function validarEntradas() {
    let valor = $('#start-grammar').val();
    let gramatica = [['S', valor]];

    for(let i = 0; i < entradas; i++) {         // Verifica o total de entradas
        let key = $(`#key-${i}`).val();
        let valor = $(`#value-${i}`).val();

        gramatica.push([key, valor])
    }

        let inputValor = $(`#input-0`).val();
        let resultado = validarGramatica(gramatica);

        if(resultado.test(inputValor))
            $(`#input-0`).css("background-color", '#67e480');
        else
            $(`#input-0`).css("background-color", '#e96379');
}

function gr_er(){
    let valor = $('#start-grammar').val();
    let gramatica = [['S', valor]];

    for(let i = 0; i < entradas; i++) {         // Verifica o total de entradas
        let key = $(`#key-${i}`).val();
        let valor = $(`#value-${i}`).val();

        gramatica.push([key, valor])
    }

    let resultado = validarGramatica(gramatica);
    localStorage.setItem('resultadoER', resultado);
    window.location.href = "expressaoRegular.html";


}