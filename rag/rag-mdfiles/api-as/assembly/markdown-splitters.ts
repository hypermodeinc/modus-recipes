/**
 * splitter functions
 */
import { recursiveCharacterTextSplitter } from "../../../../utils/as/text-splitters"
import { DocPage, Chunk, ChunkSection } from "./chunk"

export function splitMarkdown(
  id: string,
  content: string,
  max_word: i32 = 500,
  namespace: string = "",
): DocPage {
  // using recursiveCharacterTextSplitter
  // create chunck based on the header level
  // unique chunk id is "<id> > L0_1 > L1_1 > L2_3 > line number at this level" -> the 3rd L2 headers in the first L1 header in the document

  const section_zero = <ChunkSection>{ id: `${id}>L0_1`, docid: id }
  section_zero.children = []
  section_zero.chunks = []
  const doc = <DocPage>{ docid: id, root: section_zero }
  var current_section = section_zero
  const section_path = [section_zero]

  const lines = recursiveCharacterTextSplitter(
    content,
    max_word,
    ["####", "###", "##", "#"],
    ["\n\n", "\n", ";", ","],
  )
  let index_in_level = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // if the line is a header, update the current path
    if (line.startsWith("#")) {
      /* new section
       * section level = count the number of # at the beginning of the line
       */
      let level: u32 = 1
      while (line.charAt(level) == "#") {
        level += 1
      }
      console.log(`new level ${level} current ${current_section.level}`)
      // if the level is lower than the current level, go back to the parent level
      while (level <= current_section.level) {
        if (section_path.length == 0) {
          console.log(`error, no parent section`)
          break
        } else {
          section_path.pop()
          current_section = section_path[section_path.length - 1]
        }
        console.log(`pop to ${current_section.id} level ${current_section.level}`)
      }
      const index_in_section = current_section.children.length
      const section = <ChunkSection>{
        id: `${current_section.id} > L${level}_${index_in_section}`,
        docid: id,
        level: level,
        order: index_in_section,
      }
      section.chunks = []
      current_section.children.push(section)
      current_section = section
      section_path.push(section)
      console.log(`new section ${section.id}`)
    }
    let order = current_section.chunks.length
    const chunk = <Chunk>{
      id: current_section.id + ">" + order.toString(),
      docid: id,
      order: order,
      content: line,
    }
    console.log(`adding new chunk ${chunk.id}`)
    current_section.chunks.push(chunk)
  }
  return doc
}

export function splitMarkdownHeaderText(id: string, content: string, max_word: i32 = 500): Chunk[] {
  // using recursiveCharacterTextSplitter
  // create chunck based on the header level
  // unique chunk id is "<id> > L0_1 > L1_1 > L2_3 > line number at this level" -> the 3rd L2 headers in the first L1 header in the document

  const currentPath = [id, "L0_1"]
  const chunks: Chunk[] = []
  const lines = recursiveCharacterTextSplitter(
    content,
    max_word,
    ["####", "###", "##", "#"],
    ["\n\n", "\n", ";", ","],
  )
  let index_in_level = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // if the line is a header, update the current path
    if (line.startsWith("#")) {
      index_in_level = 0
      // if the header is at the same level or higher, update the path
      // analyze LX_Y
      let last_path = currentPath[currentPath.length - 1].slice(1)
      let last_path_parts = last_path.split("_")
      let last_level = parseInt(last_path_parts[0])
      let last_i = parseInt(last_path_parts[1]) as i32
      // count the number of # at the beginning of the line
      let level = 1
      while (line.charAt(level) == "#") {
        level += 1
      }
      let j: i32 = 1
      while (level <= last_level) {
        currentPath.pop()
        if (level == last_level) {
          j = last_i + 1
        }
        last_path = currentPath[currentPath.length - 1].slice(1)
        last_path_parts = last_path.split("_")
        last_level = parseInt(last_path_parts[0]) as i32
        last_i = parseInt(last_path_parts[1]) as i32
      }
      currentPath.push("L" + level.toString() + "_" + j.toString())
    }
    const chunk = <Chunk>{
      id: currentPath.join(">") + ">" + index_in_level.toString(),
      content: line,
    }
    chunks.push(chunk)
    index_in_level += 1
  }
  return chunks
}
