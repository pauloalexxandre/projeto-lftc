
let nodeCounter = 0;


function init() {
    myDiagram = new go.Diagram('myDiagramDiv', {
        'animationManager.initialAnimationStyle': go.AnimationStyle.None,
        InitialAnimationStarting: (e) => {
            var animation = e.subject.defaultAnimation;
            animation.easing = go.Animation.EaseOutExpo;
            animation.duration = 800;
            animation.add(e.diagram, 'scale', 0.3, 1);
            animation.add(e.diagram, 'opacity', 0, 1);
        },
        "ModelChanged": e => { if (e.isTransactionFinished) save(); },

        // have mouse wheel events zoom in and out instead of scroll up and down
        'toolManager.mouseWheelBehavior': go.WheelMode.Zoom,
        // support double-click in background creating a new node
        'clickCreatingTool.archetypeNodeData': { text: "q" },
        // enable undo & redo
        'undoManager.isEnabled': true
    });

    myDiagram.addModelChangedListener(evt => {
        // ignore unimportant Transaction events
        if (!evt.isTransactionFinished) return;
        const txn = evt.object;  // a Transaction
        if (txn === null) return;

        // iterate over all of the actual ChangedEvents of the Transaction
        txn.changes.each(e => {
            // ignore any kind of change other than adding/removing a node
            if (e.modelChange !== "nodeDataArray") return;

            // record node insertions and removals
            if (e.change === go.ChangeType.Insert) {
                const nodeDataArrayLength = myDiagram.model.nodeDataArray.length;
                const newNode = e.newValue;
                myDiagram.model.setDataProperty(newNode, "text", "q" + nodeDataArrayLength);
            }
        });
    });
    // when the document is modified, add a "*" to the title and enable the "Save" button

    const colors = {
        pink: '#facbcb',
        blue: '#b7d8f7',
        green: '#b9e1c8',
        yellow: '#faeb98',
        background: '#34495e'
    };
    const colorsDark = {
        green: '#3fab76',
        yellow: '#f4d90a',
        blue: '#0091ff',
        pink: '#e65257',
        background: '#34495e'
    };
    myDiagram.div.style.backgroundColor = colors.background;



    function inicial(e, obj) {
        myDiagram.commit(d => {
            const contextmenu = obj.part;
            const nodedata = contextmenu.data;

            d.model.nodeDataArray.forEach(node => {
                if (node.isStart && node !== nodedata) {
                    d.model.set(node, "isStart", false);
                }
            });

            d.model.set(nodedata, "isStart", !nodedata.isStart);
        }, "start defined");
    }


    function end(e, obj) {
        myDiagram.commit(d => {
            const contextmenu = obj.part;
            const nodedata = contextmenu.data;
            d.model.set(nodedata, "isFinal", !nodedata.isFinal);
        }, "end defined");
    }


    myDiagram.nodeTemplate = new go.Node('Auto', {
        isShadowed: true,
        shadowBlur: 0,
        shadowOffset: new go.Point(5, 5),
        shadowColor: 'black',
        isFinal: false,
        isStart: false,
        contextMenu:     // define a context menu for each node
            go.GraphObject.build("ContextMenu")  // that has one button
                .add(
                    go.GraphObject.build("ContextMenuButton", {
                        click: inicial,
                        "ButtonBorder.fill": "white",
                        "_buttonFillOver": "skyblue",
                    })
                        .add(new go.TextBlock("Inicial")),

                    go.GraphObject.build("ContextMenuButton", {
                        click: end,
                        "ButtonBorder.fill": "white",
                        "_buttonFillOver": "skyblue",
                    })
                        .add(new go.TextBlock("Final"))
                )
    })
        .add(
            new go.Shape({
                figure: "Circle",
                strokeWidth: 1.5,
                fill: colors.blue,
                portId: '',
                fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                cursor: 'pointer'
            })
                .bind('fill', 'isStart', (isStart) => {
                    if (isStart) return "#5db3a1";
                    return colors.blue;
                })
                .bind('figure', 'isFinal', (isFinal) => {
                    if (isFinal) return 'Diamond';
                    else return 'Circle';
                }),
            new go.TextBlock({
                font: 'bold small-caps 11pt helvetica, bold arial, sans-serif',
                shadowVisible: false,
                editable: true,
                text: 'q',
                margin: 8,
                font: 'bold 14px sans-serif',
                stroke: '#333'
            }).bind('text')
        );

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate = new go.Link({
        // shadow options are for the label, not the link itself
        isShadowed: true,
        shadowBlur: 0,
        shadowColor: 'black',
        shadowOffset: new go.Point(2.5, 2.5),

        curve: go.Curve.Bezier,
        curviness: 40,
        adjusting: go.LinkAdjusting.Stretch,
        reshapable: true,
        relinkableFrom: true,
        relinkableTo: true,
        fromShortLength: 8,
        toShortLength: 10
    })
        .bindTwoWay('points')
        .bind('curviness')
        .add(
            // Main shape geometry
            new go.Shape({ strokeWidth: 2, shadowVisible: false, stroke: 'white' })
                .bind('strokeDashArray', 'progress', (progress) => (progress ? [] : [5, 6]))
                .bind('opacity', 'progress', (progress) => (progress ? 1 : 0.5)),
            // Arrowheads
            new go.Shape({ fromArrow: 'circle', strokeWidth: 1.5, fill: 'white' }).bind('opacity', 'progress', (progress) => (progress ? 1 : 0.5)),
            new go.Shape({ toArrow: 'standard', stroke: null, scale: 1.5, fill: 'white' }).bind('opacity', 'progress', (progress) => (progress ? 1 : 0.5)),
            // The link label
            new go.Panel('Auto')
                .add(
                    new go.Shape('RoundedRectangle', {
                        shadowVisible: true,
                        fill: "#8fa9c2",
                        strokeWidth: 0.5
                    }),
                    new go.TextBlock({
                        font: '9pt helvetica, arial, sans-serif',
                        margin: 1,
                        editable: true,
                        text: '&'
                    })
                        .bind(new go.Binding("text", "text").makeTwoWay())
                )
        )

    // read in the JSON data from the "mySavedModel" element
    load();
}

// Show the diagram's model in JSON format
function save() {
    myDiagram.model.linkDataArray.forEach(link => {
        if (!link.hasOwnProperty("text")) {
            myDiagram.model.set(link, "text", "&")
        }
    });
    document.getElementById('mySavedModel').value = myDiagram.model.toJson();
    myDiagram.isModified = false;
}
function load() {
    const json = document.getElementById('mySavedModel').value;
    if (json) {
        const data = JSON.parse(json);
        if (data.linkDataArray) {
            data.linkDataArray.forEach(link => {
                if (!link.hasOwnProperty("text")) {
                    link.bind("text", "&");
                }
            });
        }
        myDiagram.model = go.Model.fromJson(JSON.stringify(data));
    }
}

window.addEventListener('DOMContentLoaded', init);

function verifyExpression() {
    const txt = document.getElementById("txtTest");
    const result = isAcceptedByDFA(txt.value);
    result ? txt.style.borderColor = "#42f542" : txt.style.borderColor = "red"
    //alert(result ? "A expressão é aceita." : "A expressão não é aceita.");
}

function isAcceptedByDFA(expression) {
    const nodeDataArray = myDiagram.model.nodeDataArray;
    const linkDataArray = myDiagram.model.linkDataArray;

    // Encontre o estado inicial
    const startNode = nodeDataArray.find(node => node.isStart);
    if (!startNode) {
        alert("Não há estado inicial definido.");
        return false;
    }

    let currentState = startNode.id;

    let transition = linkDataArray.find(link => link.from === currentState && link.text === "&");
    while (transition) {
        currentState = transition.to;
        transition = linkDataArray.find(link => link.from === currentState && link.text === "&");
    }

    for (const char of expression) {
        transition = linkDataArray.find(link => link.from === currentState && link.text === "&");
        while (transition) {
            currentState = transition.to;
            transition = linkDataArray.find(link => link.from === currentState && link.text === "&");
        }
        transition = linkDataArray.find(link => link.from === currentState && link.text === char);
        if (transition) {
            currentState = transition.to;
        } else {
            return false;
        }
    }

    // Verifique se o estado atual é um estado final
    const finalNode = nodeDataArray.find(node => node.id === currentState && node.isFinal);
    return !!finalNode;
}
