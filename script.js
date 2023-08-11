$(document).ready(function() {
    var db;
    var request = window.indexedDB.open('employeesDB', 1);

    request.onerror = function(event) {
        console.log('Error al abrir la base de datos', event.target.error);
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('employees')) {
            var objectStore = db.createObjectStore('employees', { keyPath: 'employeeId', autoIncrement: true });
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('adminId', 'adminId', { unique: false });
            objectStore.createIndex('email', 'email', { unique: false });
        }
    };

    

    request.onsuccess = function(event) {
        db = event.target.result;

        const firebaseConfig = {
            apiKey: "AIzaSyDPfSM7FJm1MwnuI2sOhpi__x04JEf21_A",
            authDomain: "atomic-bird-387720.firebaseapp.com",
            databaseURL: "https://atomic-bird-387720-default-rtdb.firebaseio.com",
            projectId: "atomic-bird-387720",
            storageBucket: "atomic-bird-387720.appspot.com",
            messagingSenderId: "820541027895",
            appId: "1:820541027895:web:c9f5a95216a8ac210bb1b2"
        };
        
        firebase.initializeApp(firebaseConfig);

        

        function showMessage(elementId) {
            $('#' + elementId).fadeIn().delay(2000).fadeOut();
        }

        if (!navigator.onLine) {
            showMessage('offlineMessage');
        } else {
            showMessage('onlineMessage');
        }

        window.addEventListener('online', function() {
            showMessage('onlineMessage');
        });

        window.addEventListener('offline', function() {
            showMessage('offlineMessage');
        });

        // Cargar empleados al cargar la página
        loadEmployees();

        // Agregar/Actualizar empleado al formulario
        $('#employeesForm').submit(function(event) {
            event.preventDefault();
            var employeeIdToUpdate = parseInt($('#employeeId').val());
            var name = $('#name').val();
            var adminId = parseInt($('#adminId').val());
            var email = $('#emailInput').val(); // Usamos el nuevo id "emailInput" para obtener el valor

            if (employeeIdToUpdate) {
                // Actualizar empleado en la base de datos local
                updateEmployee(employeeIdToUpdate, name, adminId, email);
            } else {
                // Agregar empleado a la base de datos local
                addEmployee(name, adminId, email);
                addEmployeeToFirebase(name, adminId, email);
            }

            // Limpiar formulario
            $('#employeeId').val('');
            $('#name').val('');
            $('#adminId').val('');
            $('#emailInput').val('');

            // Cambiar botón y título del formulario
            $('#employeesForm button[type="submit"]').text('Agregar/Actualizar Empleado');
            $('#employeesForm h2').text('Agregar Empleado');
        });

        // Cancelar edición
        $('#cancelBtn').click(function() {
            // Limpiar formulario
            $('#employeeId').val('');
            $('#name').val('');
            $('#adminId').val('');
            $('#emailInput').val('');

            // Cambiar botón y título del formulario
            $('#employeesForm button[type="submit"]').text('Agregar/Actualizar Empleado');
            $('#employeesForm h2').text('Agregar Empleado');
        });
    };

    // Función para cargar empleados
    function loadEmployees() {
        var objectStore = db.transaction('employees').objectStore('employees');
        var employeesList = $('#employeesList');
        employeesList.empty();

        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;

            if (cursor) {
                var employee = cursor.value;
                var employeesTable = employeesList.find('#employeesTable');

                if (!employeesTable.length) {
                    employeesTable = $('<table id="employeesTable">');
                    employeesTable.append('<tr><th>Nombre</th><th>Numeracion ID</th><th>Correo Electronico</th><th>Edit</th><th>Delete</th></tr>');
                    employeesList.append(employeesTable);
                }

                var row = $('<tr>');
                row.append('<td>' + employee.name + '</td>');
                row.append('<td>' + employee.adminId + '</td>');
                row.append('<td>' + employee.email + '</td>');
                row.append('<td><button class="editEmployee" data-id="' + employee.employeeId + '">Editar</button></td>');
                row.append('<td><button class="deleteEmployee" data-id="' + employee.employeeId + '">Eliminar</button></td>');

                employeesTable.append(row);
                cursor.continue();
            } else {
                if (employeesList.children().length === 0) {
                    employeesList.text('No hay empleados registrados.');
                }
            }
        };
    }

    // Agregar empleado a la base de datos local
    function addEmployee(name, adminId, email) {
        var transaction = db.transaction(['employees'], 'readwrite');
        var objectStore = transaction.objectStore('employees');

        var employee = {
            name: name,
            adminId: adminId,
            email: email
        };

        var request = objectStore.add(employee);

        request.onsuccess = function(event) {
            console.log('Empleado agregado correctamente');
            loadEmployees();
        };

        request.onerror = function(event) {
            console.log('Error al agregar el empleado', event.target.error);
        };
    }

    // Actualizar empleado en el formulario
    $(document).on('click', '.editEmployee', function() {
        var employeeIdToUpdate = parseInt($(this).data('id'));
        var transaction = db.transaction(['employees'], 'readwrite');
        var objectStore = transaction.objectStore('employees');

        var request = objectStore.get(employeeIdToUpdate);

        request.onsuccess = function(event) {
            var employee = event.target.result;

            if (employee) {
                // Llenar formulario con los datos del empleado
                $('#name').val(employee.name);
                $('#employeeId').val(employee.employeeId);
                $('#adminId').val(employee.adminId);
                $('#emailInput').val(employee.email); // Usamos el campo 'email' del objeto 'employee' para mostrar el correo electrónico

                // Cambiar botón y título del formulario
                $('#employeesForm button[type="submit"]').text('Actualizar Empleado');
                $('#employeesForm h2').text('Editar Empleado');
            } else {
                console.log('Empleado con ID ' + employeeIdToUpdate + ' no encontrado');
            }
        };

        request.onerror = function(event) {
            console.log('Error al obtener el empleado para editar', event.target.error);
        };
    });

    // Actualizar empleado en la base de datos local
    function updateEmployee(employeeIdToUpdate, name, adminId, email) {
        var transaction = db.transaction(['employees'], 'readwrite');
        var objectStore = transaction.objectStore('employees');

        var request = objectStore.get(employeeIdToUpdate);

        request.onsuccess = function(event) {
            var employee = event.target.result;

            if (employee) {
                employee.name = name;
                employee.adminId = adminId;
                employee.email = email;

                var updateRequest = objectStore.put(employee);

                updateRequest.onsuccess = function(event) {
                    console.log('Empleado actualizado correctamente');
                    loadEmployees();
                };

                updateRequest.onerror = function(event) {
                    console.log('Error al actualizar el empleado', event.target.error);
                };
            } else {
                console.log('Empleado con ID ' + employeeIdToUpdate + ' no encontrado');
            }
        };

        request.onerror = function(event) {
            console.log('Error al obtener el empleado para actualizar', event.target.error);
        };
    }

    // Eliminar empleado de la base de datos local
    $(document).on('click', '.deleteEmployee', function() {
        var employeeId = $(this).data('id');
        var transaction = db.transaction('employees', 'readwrite');
        var objectStore = transaction.objectStore('employees');

        var request = objectStore.delete(Number(employeeId));

        request.onsuccess = function(event) {
            console.log('Empleado eliminado correctamente');
            loadEmployees();
        };

        request.onerror = function(event) {
            console.log('Error al eliminar el empleado', event.target.error);
        };
    });
});
// Agregar empleado a Firebase Realtime Database
function addEmployeeToFirebase(name, adminId, email) {
    const database = firebase.database();

    // Crear una nueva referencia en la colección 'employees' y agregar los datos del empleado
    database.ref('employees').push({
        name: name,
        adminId: adminId,
        email: email
    }).then(function(response) {
        console.log('Empleado agregado a Firebase Realtime Database con ID: ' + response.key);
    }).catch(function(error) {
        console.log('Error al agregar el empleado a Firebase Realtime Database', error);
    });
}
