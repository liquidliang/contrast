/*
 * @Author: liquidliang
 * @Date:   2016-12-05 09:54:50
 * @Last Modified by:   liquidliang
 * @Last Modified time: 2016-12-05 13:31:23
 */
(function() {

    'use strict';

    //model定义---------------------------------------------
    var store = (function() {
        var key = 'bcd-mvc-todu';
        var todoData = JSON.parse(localStorage.getItem(key) || '[]');
        var todoStore = new BCD.Model(todoData);
        var update = function() {
            todoStore.set(todoData);
            localStorage.setItem(key, JSON.stringify(todoData));
            todoStore.trigger('update');
        };
        var add = function(title) {
            todoData.push({
                title: title,
                completed: false
            });
            update();
        };
        var remove = function(idx) {
            todoData.splice(idx, 1);
            update();
        };
        var removeCompleted = function() {
            todoData = todoData.filter(function(item) {
                return !item.completed;
            });
            update();
        };
        var toggle = function(idx) {
            var item = todoData[idx];
            if (item) {
                item.completed = !item.completed;
                update();
            }
        };
        var edit = function(idx, title) {
            todoData[idx].title = title;
            update();
        };
        var toggleAll = function(val) {
            todoData = todoData.map(function(item) {
                item.completed = !!val;
                return item;
            });
            update();
        };
        return $.extend(todoStore, {
            add,
            remove,
            toggle,
            toggleAll,
            edit,
            removeCompleted
        });
    })();

    //注册指令---------------------------------------------------
    BCD.addEvent('todu_input', function(ele) {
        ele.on('keypress', function(e) {
            if (e.keyCode == '13' && ele.val()) {
                store.add(ele.val());
                ele.val('');
            }
        });
    });

    BCD.addEvent('todo_toggle_all', function(ele, option, data) {
        if (data.every(function(item) {
                return item.completed
            })) {
            ele.attr('checked', true);
        }
        ele.on('click', function(e) {
            store.toggleAll(ele.is(':checked'));
            e.stopPropagation();
        })
    });

    BCD.addEvent('todo_remove_completed', function(ele, option, data) {
        ele.on('click', function(e) {
            store.removeCompleted();
            e.stopPropagation();
        });
    });

    BCD.addEvent('todo_bind_item', function(donLi, option) {
        var domLabel = donLi.find('label');
        var domEditInput = donLi.find('input.edit');
        var domToggleInput = donLi.find('input.toggle');
        var domDestroy = donLi.find('.destroy');

        domLabel.on('dblclick', function(e) {
            donLi.addClass('editing');
            domEditInput[0].focus();
        });
        var save = function(e) {
            donLi.removeClass('editing');
            store.edit(option.idx, domEditInput.val());
        };
        domEditInput.on('blur', save);
        domEditInput.on('keypress', function(e) {
            if (e.keyCode == '13') {
                save();
            }
        });
        domToggleInput.on('change', function() {
            store.toggle(option.idx);
        });
        domDestroy.on('click', function(e) {
            store.remove(option.idx);
            e.stopPropagation();
        });
    });

    //定义view----------------------------------------------------------------------------------
    var filterKey = 'all';
    var filterFun = function(item, i) {
        item.idx = i;
        switch (filterKey) {
            case 'completed':
                return item.completed;
            case 'active':
                return !item.completed;
        }
        return true;
    }
    var viewMain = $('<section class="main"></section>').setView({
        name: 'todo/main',
        getData: function() {
            return store.get().filter(filterFun);
        },
        end: function(){
            if(!store.get().length){
                return 'hide';
            }
        },
        template: '<%var list=obj || []; if(!list.length){return "";}%><input class="toggle-all" type="checkbox" data-on="?m=todo_toggle_all">' +
            '<ul class="todo-list">' +
            '  <%list.forEach(function(item){%><li class="<%=item.completed ? "completed" : ""%>" data-on="?m=todo_bind_item&idx=<%=item.idx%>">' +
            '    <div class="view">' +
            '      <input class="toggle" type="checkbox" <%=item.completed ? "checked" : ""%>>' +
            '      <label><%-item.title%></label>' +
            '      <button class="destroy"></button>' +
            '    </div>' +
            '    <input class="edit" value="<%-item.title%>">' +
            '  </li><%});%>' +
            '</ul>',
    });
    var viewFoot = $('<footer class="footer"></footer>').setView({
        name: 'todo/foot',
        getData: function() {
            var todo = store.get();
            var links = ['all', 'active', 'completed'].map(function(item) {
                return {
                    hash: item,
                    name: item[0].toUpperCase() + item.substr(1),
                    cls: filterKey == item ? 'selected' : ''
                }
            });
            return {
                links: links,
                remaining: todo.filter(function(item) {
                    return !item.completed
                }).length,
                showClear: todo.some(function(item) {
                    return item.completed
                })
            };
        },
        end: function(){
            if(!store.get().length){
                return 'hide';
            }
        },
        template: '<span class="todo-count">' +
            '  <strong><%=obj.remaining%></strong> items left' +
            '</span>' +
            '<ul class="filters"><%obj.links.forEach(function(item){%>' +
            '  <li><a href="#!/todo/<%=item.hash%>" class="<%=item.cls%>"><%=item.name%></a></li>' +
            '<%})%></ul>' +
            '<button class="clear-completed" data-on="?m=todo_remove_completed" style="<%=obj.showClear ? "" : "display:none"%>">' +
            '  Clear completed' +
            '</button>',
    });
    var pageTodo = $('[data-page="todo"]').setView({
        title: 'bcd.js • TodoMVC',
        viewList: [viewMain, viewFoot],
        start: function() {
            filterKey = BCD.getHash(1);
            if (!/^active$|^completed$/.test(filterKey)) {
                filterKey = 'all';
            }
        }
    });

    store.on('update', function() {
        viewMain.reset();
        viewFoot.reset();
    });
    BCD.app();
})();
