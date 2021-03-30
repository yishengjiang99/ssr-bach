diskutil erasevolume HFS+ 'RAMDisk' `hdiutil attach -nobrowse -nomount ram://4194304`
rm file.sf2
cp $1 /Volumes/RAMDisk/file.sf2
ln -s /Volumes/RAMDisk/file.sf2
