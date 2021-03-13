export default function({list1,list2,list1Link,list2Link}){
	<ul class="list-group" style="max-height: 15; overflow-y: scroll">
		{list1.map((p) => list1Link(file))}
	</ul>
	<ul class="list-group" style="max-height: 15vh; overflow-y: scroll">
		{list2.map((p) => list2Link(file))} 
	</ul>
}