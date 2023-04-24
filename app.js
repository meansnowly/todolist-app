//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set('strictQuery', false); //mongoose version ใหม่ จะกำหนด strictQuery เริ่มแรกเป็น false ถ้าไม่มีการ set จะขึ้น warning, false คือ อนุญาติให้ save document นอกเหนือจากที่กำหนดใน Schema ได้ , true คือ อนุญาติให้เฉพาะที่ระบุใน Schema เท่านั้น
//mongoose.connect("mongodb://127.0.0.1:27017/todolistDB"); // สั่ง mongoose เชื่อมต่อ Database และ useNewUrlParser: true} ใช้แค่การรันครั้งแรก
mongoose.connect("mongodb+srv://admin-mean:Mean06716@cluster0.jrjbhhv.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({ //Schema คือ consturctor รูปแบบ structures
  name: String
});

const Item = mongoose.model("Item", itemsSchema); // Model ของ mongoose คือ Collections

//default document==============
const item1 = new Item({
  name: "เขียนสิ่งที่ต้องการทำ"
});
const item2 = new Item({
  name: "กดปุ่ม + เพื่อเพิ่ม"
});
const item3 = new Item({
  name: "เมื่อเสร็จแล้ว ให้ติ๊กถูกด้านหน้า"
});
//default document==============


const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);


  List.findOne({ name: customListName }, function (err, results) {
    if (!err) {
      if (!results) {
        //Create the new List
        const list = new List({
          name: customListName,
          items: defaultItem
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        //Show existing List
        res.render("list", { listTitle: results.name, newListItems: results.items });
      }
    }
  });



});

app.get("/", function (req, res) {

  Item.find({}, function (err, results) {
    if (results.length === 0) { // check ถ้าไม่มีข้อมูล list จะทำการ insert default item
      // insert document to database
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default item to db");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });

});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted item");
      }
      res.redirect("/");
    });
  }else{
   List.findOneAndUpdate({name: listName},{$pull:{items: {_id:checkItemId}}},function (err,foundList){
    if(!err){
      res.redirect("/"+listName);
    }
   });
  }



});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
