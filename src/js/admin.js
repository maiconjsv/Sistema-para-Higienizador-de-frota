const firebaseConfig = {
    apiKey: "AIzaSyCy3aUY2OWKXFMyZBkX1NQEL8haZbdHSyk",
    authDomain: "garagem-online-34080.firebaseapp.com",
    projectId: "garagem-online-34080",
    storageBucket: "garagem-online-34080.firebasestorage.app",
    messagingSenderId: "804666498964",
    appId: "1:804666498964:web:934f99d6b039c453eaf981"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore();

const nameInfoDiv = document.getElementById('nameInfo');
const companyInfoDiv = document.getElementById('companyInfo');
const logoutButton = document.getElementById('logoutButton');

// Monitorar o estado da autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Usuário logado no Painel:", user.email, user.uid);
        // Garante que os elementos existem antes de tentar manipulá-los
        if (nameInfoDiv) nameInfoDiv.textContent = user.displayName || user.email;
        if (companyInfoDiv) companyInfoDiv.textContent = "Localiza SemiNovos";
    } else {
        console.log("Usuário não logado. Redirecionando para a página de login.");
        // Redireciona apenas se não estiver na página de login
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.assign('/index.html');
        }
    }
});


// Lógica para o botão de Desconectar-se 
// Verifica se o botão existe antes de adicionar o listener
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                console.log("Deslogado do Painel. Redirecionando para a página de login.");
                window.location.assign('/index.html');
            })
            .catch((error) => {
                console.error("Erro ao deslogar:", error.message);
                alert(`Erro ao deslogar: ${error.message}`);
            });
    });
}

//Lógica de consulta de quantos veiculos tem no pátio
const patioDivElement = document.getElementById('patioDivId');
const veiculosInfoElement = document.getElementById('veiculosInfo');

function loadVeiculosNoPatio() {
    if (!veiculosInfoElement) {
        console.error("Elemento 'veiculosInfo' não encontrado! Verifique o ID no seu HTML.");
        return;
    }

    veiculosInfoElement.textContent = "Carregando veículos..."; // Mensagem de carregamento

    // Verifica se o Firestore está inicializado
    if (!db) {
        console.error("Firestore não inicializado. Verifique a configuração do Firebase.");
        veiculosInfoElement.textContent = "Erro: Firestore não disponível.";
        return;
    }

    // Cria uma consulta para buscar veículos com status 'disponivel'
    const veiculosCollectionRef = db.collection("veiculosHigienizados");
    const q = veiculosCollectionRef.where('status', '==', 'disponivel'); // Filtra pelo status 'disponivel'

    // Usa onSnapshot para obter atualizações em tempo real
    q.onSnapshot((querySnapshot) => {
        const totalVeiculos = querySnapshot.size; // O número de documentos retornados pela consulta

        if (veiculosInfoElement) {
            if (totalVeiculos === 0) {
                veiculosInfoElement.textContent = "Nenhum veículo no pátio.";
            } else if (totalVeiculos === 1) {
                veiculosInfoElement.textContent = `${totalVeiculos} veículo no pátio.`;
            } else {
                veiculosInfoElement.textContent = `${totalVeiculos} veículos no pátio.`;
            }
        }
    }); 
} 

    
loadVeiculosNoPatio();


// =============================================================
// FUNÇÃO PARA REGISTRAR VEÍCULO HIGIENIZADO
// Esta função é chamada APÓS o DOM ser completamente carregado
async function registrarVeiculoHigienizado() {
    
    const placaInput = document.getElementById('placaInput');
    const modeloInput = document.getElementById('modeloInput');
    const corInput = document.getElementById('corInput');
    const dataInput = document.getElementById('dataInput');
    const registerButton = document.getElementById('registerHigien');

    // Verificação básica para garantir que todos os inputs existem
    if (!placaInput || !modeloInput || !corInput || !dataInput || !registerButton) {
        console.error("Um ou mais elementos HTML para registro de higienização não foram encontrados. Verifique os IDs.");
        return;
    }

    // 2. Adicionar um "ouvinte de evento" ao botão Registrar
    registerButton.addEventListener('click', async () => {
        // Pega os valores dos inputs
        const placa = placaInput.value.trim().toUpperCase();
        const modelo = modeloInput.value.trim();
        const cor = corInput.value.trim();
        const data = dataInput.value;

        // Validação simples
        if (!placa || !modelo || !cor || !data) {
            alert('Por favor, preencha todos os campos para registrar!');
            return;
        }

        // Verificar se o usuário está autenticado antes de registrar
        if (!auth.currentUser) {
            alert('Você precisa estar logado para registrar veículos.');
            console.warn('Registro negado: Usuário não autenticado.');
            return;
        }

        try {
            const veiculosCollectionRef = db.collection("veiculosHigienizados");

            const docRef = await veiculosCollectionRef.add({
                placa: placa,
                modelo: modelo,
                cor: cor,
                dataHigienizacao: data,
                dataRegistro: new Date(),
                userId: auth.currentUser.uid,
                status: "disponivel"
            });

            console.log("Documento escrito com ID: ", docRef.id);
            alert("Informações do veículo registradas com sucesso!");

            // Limpar os campos do formulário após o registro
            placaInput.value = '';
            modeloInput.value = '';
            corInput.value = '';
            dataInput.value = '';

        } catch (e) {
            console.error("Erro ao adicionar documento: ", e);
            alert("Erro ao registrar o veículo. Tente novamente. Verifique o console para mais detalhes.");
        }
    });
}


// =============================================================
// Adicionar TODOS os listeners e referências que dependem do DOM
// dentro de um DOMContentLoaded para garantir que os elementos HTML existam antes de manipulá-los.
document.addEventListener('DOMContentLoaded', () => {

    // Isso garante que o listener do botão 'registerHigien' seja ativado.
    registrarVeiculoHigienizado();

    // --- CAPTURA DE REFERÊNCIAS PARA A SEÇÃO DE SAÍDA DE VEÍCULOS ---
    const placaSaidaInput = document.getElementById("placaSaida");
    const motivoSaidaInput = document.getElementById("motivoSaida");
    const registrarSaidaButton = document.getElementById("registrarSaida");
    const removeCarWorkDiv = document.getElementById("removeCarWorkId");


    // Funcionamento da seção WorkLink (seletores e listeners)
    // Verifica se os elementos existem antes de adicionar listeners
    const registrarHigien = document.querySelector('.higienStart');
    const startHigien = document.getElementById('workStart');
    const esconderHud = document.querySelectorAll('.workLink');
    const backToWorkLinks = document.getElementById('backToWorkLinks');

    const consultarVeiculo = document.querySelector('#consult');
    const carConsult = document.querySelector('.carConsult');
    const backToWorkLinksConsult = document.querySelector('#backToWorkLinksConsult');

    if (startHigien && registrarHigien && esconderHud && backToWorkLinks) {
        startHigien.addEventListener('click', () => {
            registrarHigien.classList.remove('wOff');
            esconderHud.forEach(div => div.classList.add('workLinkOff'));
        });

        backToWorkLinks.addEventListener('click', () => {
            registrarHigien.classList.add('wOff');
            esconderHud.forEach(div => div.classList.remove('workLinkOff'));
        });
    }

    if (consultarVeiculo && carConsult && esconderHud && backToWorkLinksConsult) {
        consultarVeiculo.addEventListener('click', () => {
            carConsult.classList.remove('carConsultOff');
            esconderHud.forEach(div => div.classList.add('workLinkOff'));
        });

        backToWorkLinksConsult.addEventListener('click', () => {
            carConsult.classList.add('carConsultOff');
            esconderHud.forEach(div => div.classList.remove('workLinkOff'));
            // Limpar os resultados da consulta ao clicar em Voltar, se a div existir
            if (consultInfos) {
                consultInfos.innerHTML = '<p>Aguardando consulta da placa...</p>';
            }
            // Limpar o input da placa ao voltar
            if (licensePlateInput) {
                licensePlateInput.value = '';
            }
            // Limpar o input do modelo ao voltar
            if (carModeloConsult) {
                carModeloConsult.value = '';
            }
        });
    }

    //Lógica da seção de SubInfos ===========
    const patioLink = document.querySelector('#patioLink')
    const patioDiv = document.querySelector('.patioDiv')
    const fecharPatioDiv = document.querySelector('#patioCloseButton')

    if (patioLink && patioDiv && esconderHud && fecharPatioDiv) {
        patioLink.addEventListener('click', () => {
            esconderHud.forEach(div => div.classList.add('workLinkOff'));
            patioDiv.classList.remove('patioDivOff')
        })

        fecharPatioDiv.addEventListener('click', () => {
            patioDiv.classList.add('patioDivOff')
            esconderHud.forEach(div => div.classList.remove('workLinkOff'));
        })
    }


    const removeCarWork = document.querySelector('.removeCarWork')
    const closeRemoveCarWork = document.querySelector('#closeRemoveCarWork')
    const removeCarLink = document.querySelector('#removeCar')

    if (removeCarLink && esconderHud && removeCarWork && closeRemoveCarWork) {
        removeCarLink.addEventListener('click', () => {
            esconderHud.forEach(div => div.classList.add('workLinkOff'));
            removeCarWork.classList.remove('removeCarWorkOff')
        })

        // Listener para o botão de "Voltar" da tela de saída
        closeRemoveCarWork.addEventListener('click', () => {
            removeCarWork.classList.add('removeCarWorkOff')
            esconderHud.forEach(div => div.classList.remove('workLinkOff'));
            // Adicionado: Limpar os campos ao fechar a tela de saída
            if (placaSaidaInput) placaSaidaInput.value = '';
            if (motivoSaidaInput) motivoSaidaInput.value = '';
        })
    }


    // --- LÓGICA DE REGISTRAR SAÍDA DE VEÍCULOS ---
    if (registrarSaidaButton && placaSaidaInput && motivoSaidaInput && removeCarWorkDiv) {
        registrarSaidaButton.addEventListener("click", async () => {
            const placaDigitada = placaSaidaInput.value.trim().toUpperCase();
            const motivoSaida = motivoSaidaInput.value.trim();

            if (!placaDigitada) {
                alert("Por favor, digite a placa do veículo para registrar a saída.");
                return;
            }

            if (!motivoSaida) {
                alert("Por favor, digite o motivo da saída do veículo.");
                return;
            }

            // Confirmação para o usuário
            const confirmarSaida = confirm(`Tem certeza que deseja registrar a saída do veículo de placa "${placaDigitada}"?`);
            if (!confirmarSaida) {
                return; // Usuário cancelou
            }

            // Verificar se o usuário está autenticado antes de prosseguir
            if (!auth.currentUser) {
                alert('Você precisa estar logado para registrar a saída de veículos.');
                console.warn('Operação negada: Usuário não autenticado.');
                return;
            }

            try {
                const veiculosCollectionRef = db.collection("veiculosHigienizados");

                const querySnapshot = await veiculosCollectionRef.where("placa", "==", placaDigitada).get();

                if (querySnapshot.empty) {
                    alert(`Veículo com a placa "${placaDigitada}" não encontrado nos registros de higienização.`);
                    console.warn(`Tentativa de registrar saída de veículo não existente: ${placaDigitada}`);
                } else {
                    // Para cada documento encontrado (embora placas geralmente sejam únicas,
                    // esta abordagem lida com múltiplas entradas se houver algum erro de duplicação)
                    querySnapshot.forEach(async (documentoVeiculo) => {
                        const documentId = documentoVeiculo.id;
                        const docRef = veiculosCollectionRef.doc(documentId);

                        await docRef.update({
                            status: "saida_patio",
                            dataSaida: new Date(),
                            motivoSaida: motivoSaida,
                            registradoPorSaida: auth.currentUser.uid
                        });

                        alert(`Saída do veículo de placa "${placaDigitada}" registrada com sucesso!`);
                        console.log(`Documento do veículo ${placaDigitada} (ID: ${documentId}) atualizado para 'saida_patio'.`);

                        // Limpar os campos e fechar a div após sucesso
                        placaSaidaInput.value = '';
                        motivoSaidaInput.value = '';
                        removeCarWorkDiv.classList.add("removeCarWorkOff");
                        // Opcional: Voltar os outros elementos para o estado original (se necessário)
                        if (esconderHud) esconderHud.forEach(div => div.classList.remove('workLinkOff'));
                    });
                }

            } catch (error) {
                console.error("Erro ao registrar saída do veículo:", error);
                alert(`Ocorreu um erro ao registrar a saída: ${error.message}. Verifique o console para mais detalhes.`);

                if (error.code === 'permission-denied') {
                    alert("Erro de permissão: Você não tem autorização para registrar a saída. Verifique se está logado.");
                }
            }
        });
    }

    // =============================================================
    // LÓGICA DE CONSULTA DE VEÍCULOS
    const licensePlateInput = document.getElementById('carPlacaConsult');
    const consultCarButton = document.getElementById('carConsultButton');
    const consultInfos = document.getElementById('consultInfos');
    const carModeloConsult = document.getElementById('carModeloConsult'); // Adicionado para referenciar o input de modelo

    // Verificar se os elementos foram encontrados (para ajudar no debug, caso os IDs no HTML estejam errados)
    if (!licensePlateInput) console.error("ERRO: Elemento 'carPlacaConsult' não encontrado! Verifique o ID no seu HTML.");
    if (!consultCarButton) console.error("ERRO: Elemento 'carConsultButton' não encontrado! Verifique o ID no seu HTML.");
    if (!consultInfos) console.error("ERRO: Elemento 'consultInfos' não encontrado! Verifique o ID no seu HTML.");
    if (!carModeloConsult) console.error("ERRO: Elemento 'carModeloConsult' não encontrado! Verifique o ID no seu HTML."); // Verificação para o novo input

    if (consultCarButton && licensePlateInput && consultInfos && carModeloConsult) {
        consultCarButton.addEventListener('click', async () => {

            const licensePlate = licensePlateInput.value.trim().toUpperCase();
            const carModel = carModeloConsult.value.trim(); // Pega o valor do input do modelo

            // Limpa o conteúdo da div de informações a cada nova consulta e dá feedback
            consultInfos.innerHTML = '<p>Buscando dados...</p>';

            // Verifica se o usuário está autenticado primeiro
            if (!auth.currentUser) {
                console.warn('Consulta Firestore negada: Usuário não autenticado.');
                consultInfos.innerHTML = '<p style="color: red;">Erro: Você precisa estar logado para consultar veículos. Por favor, faça login.</p>';
                return;
            }

            let querySnapshot;
            const veiculosCollectionRef = db.collection("veiculosHigienizados");

            // Lógica para decidir qual tipo de busca realizar
            if (licensePlate.length === 7) { // Prioriza a busca pela placa se uma placa válida for digitada
                console.log(`Tentando consultar dados para a placa: ${licensePlate}`);
                querySnapshot = await veiculosCollectionRef.where('placa', '==', licensePlate).get();
            } else if (carModel) { // Se não houver placa válida, tenta a busca pelo modelo
                console.log(`Tentando consultar dados para o modelo: ${carModel}`);
                // Para buscar por partes do modelo, ou modelos semelhantes, você precisaria de um índice de texto completo ou de lógica de busca mais avançada.
                // Esta busca será por correspondência exata do modelo.
                querySnapshot = await veiculosCollectionRef.where('modelo', '==', carModel).get();
            } else {
                // Nem placa nem modelo foram digitados
                consultInfos.innerHTML = '<p style="color: orange;">Por favor, digite uma placa válida (7 caracteres) ou um modelo para consultar.</p>';
                return; // Sai da função se não houver critério de busca
            }

            if (querySnapshot.empty) {
                console.log('Nenhum veículo encontrado com os critérios fornecidos.');
                consultInfos.innerHTML = '<p style="color: orange;">Nenhum veículo encontrado com os critérios fornecidos.</p>';
            } else {
                let htmlContent = '';
                if (licensePlate.length === 7) { // Se a busca foi por placa, exibe todos os detalhes como antes
                     htmlContent = '<h3>Detalhes do Veículo Encontrado:</h3>';
                     querySnapshot.forEach((doc) => {
                        const dadosVeiculo = doc.data();
                        console.log(`Veículo encontrado: ${doc.id} => `, dadosVeiculo);

                        let dataFormatadaHigienizacao = 'N/A';
                        // Tenta converter o Timestamp do Firebase
                        if (dadosVeiculo.dataHigienizacao && typeof dadosVeiculo.dataHigienizacao.toDate === 'function') {
                            dataFormatadaHigienizacao = dadosVeiculo.dataHigienizacao.toDate().toLocaleDateString('pt-BR');
                        } else if (dadosVeiculo.dataHigienizacao) {
                            // Tenta tratar como string ou objeto Date comum
                            try {
                                dataFormatadaHigienizacao = new Date(dadosVeiculo.dataHigienizacao).toLocaleDateString('pt-BR');
                            } catch (e) {
                                dataFormatadaHigienizacao = dadosVeiculo.dataHigienizacao;
                            }
                        }

                        // --- LÓGICA PARA EXIBIR O STATUS DE SAÍDA ---
                        let statusVeiculo = dadosVeiculo.status || 'disponivel'; // Usa 'disponivel' como padrão, alinhado com loadVeiculosNoPatio
                        let infoSaida = '';

                        if (statusVeiculo === 'saida_patio') {
                            let dataSaidaFormatada = 'N/A';
                            // Verifica se dataSaida é um Timestamp do Firebase ou uma string/data normal
                            if (dadosVeiculo.dataSaida && typeof dadosVeiculo.dataSaida.toDate === 'function') {
                                dataSaidaFormatada = dadosVeiculo.dataSaida.toDate().toLocaleDateString('pt-BR') + ' às ' + dadosVeiculo.dataSaida.toDate().toLocaleTimeString('pt-BR');
                            } else if (dadosVeiculo.dataSaida) {
                                try {
                                    // Tenta converter para Date caso seja uma string de data
                                    dataSaidaFormatada = new Date(dadosVeiculo.dataSaida).toLocaleDateString('pt-BR') + ' às ' + new Date(dadosVeiculo.dataSaida).toLocaleTimeString('pt-BR');
                                } catch (e) {
                                    // Se não for uma data válida, exibe como está
                                    dataSaidaFormatada = dadosVeiculo.dataSaida;
                                }
                            }
                            infoSaida = `<p style="color: red; font-weight: bold;">STATUS: SAÍDA DO PÁTIO</p>
                                         <p><strong>Data da Saída:</strong> ${dataSaidaFormatada}</p>
                                         <p><strong>Motivo da Saída:</strong> ${dadosVeiculo.motivoSaida || 'N/A'}</p>
                                         <p><strong>Registrado por (Saída):</strong> ${dadosVeiculo.registradoPorSaida || 'N/A'}</p>`;
                        } else {
                            infoSaida = `<p style="color: green; font-weight: bold;">STATUS: NO PÁTIO</p>`;
                        }
                        // --- FIM DA LÓGICA DE EXIBIÇÃO DE STATUS ---


                        htmlContent += `
                            <div style="border-bottom: 1px dashed #eee; padding-bottom: 10px; margin-bottom: 10px;">
                                <p><strong>Placa:</strong> ${dadosVeiculo.placa}</p>
                                <p><strong>Modelo:</strong> ${dadosVeiculo.modelo}</p>
                                <p><strong>Cor:</strong> ${dadosVeiculo.cor}</p>
                                <p><strong>Última Higienização:</strong> ${dataFormatadaHigienizacao}</p>
                                <p><strong>Registrado por (Higienização):</strong> ${dadosVeiculo.userId || 'N/A'}</p>
                                ${infoSaida}
                            </div>
                        `;
                    });
                } else if (carModel) { // Se a busca foi por modelo, exibe apenas placa e cor
                    htmlContent = `<h3>Veículos Encontrados com o Modelo "${carModel}":</h3><ul style="list-style: none; padding: 0;">`;
                    querySnapshot.forEach((doc) => {
                        const dadosVeiculo = doc.data();
                        htmlContent += `
                            <li style="margin-bottom: 5px;">
                                <span style="font-weight: bold; color: white;">Placa:</span> ${dadosVeiculo.placa}, 
                                <span style="font-weight: bold; color: white;">Cor:</span> ${dadosVeiculo.cor}
                            </li>`;
                    });
                    htmlContent += '</ul>';
                }
                consultInfos.innerHTML = htmlContent;
            }
            // Limpa os campos de input após a consulta, independentemente do tipo de busca
            licensePlateInput.value = '';
            carModeloConsult.value = '';
        });
    }

}); // FIM DO DOMContentLoaded principal
